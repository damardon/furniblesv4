// src/modules/reviews/reviews.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  CreateReviewResponseDto,
  VoteReviewDto,
  ReportReviewDto,
  FilterReviewDto,
  ModerateReviewDto
} from './dto';
import { 
  Prisma, 
  ReviewStatus, 
  ReviewHelpfulness
} from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  // ============================================
  // CREATE REVIEW
  // ============================================
  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const { orderId, productId, rating, title, comment, pros, cons, images } = createReviewDto;

    // 1. Verificar que la orden existe y pertenece al usuario
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
        status: 'COMPLETED'
      },
      include: {
        items: {
          where: { productId }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('order.notFound');
    }

    if (!order.items.length) {
      throw new BadRequestException('product.notInOrder');
    }

    // 2. Verificar que no existe review previa
    const existingReview = await this.prisma.review.findUnique({
      where: {
        orderId_productId_buyerId: {
          orderId,
          productId,
          buyerId: userId
        }
      }
    });

    if (existingReview) {
      throw new ConflictException('review.alreadyExists');
    }

    // 3. Obtener información del producto y seller
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true, title: true }
    });

    if (!product) {
      throw new NotFoundException('product.notFound');
    }

    // 4. Validar imágenes si se proporcionan
    if (images && images.length > 0) {
      if (images.length > 5) {
        throw new BadRequestException('images.tooMany');
      }

      const validImages = await this.prisma.file.findMany({
        where: {
          id: { in: images },
          uploadedById: userId,
          type: 'REVIEW_IMAGE',
          status: 'ACTIVE'
        }
      });

      if (validImages.length !== images.length) {
        throw new BadRequestException('images.invalid');
      }
    }

    // 5. Crear la review en una transacción
    const review = await this.prisma.$transaction(async (tx) => {
      // Crear review
      const newReview = await tx.review.create({
        data: {
          orderId,
          productId,
          buyerId: userId,
          sellerId: product.sellerId,
          rating,
          title,
          comment,
          pros,
          cons,
          status: 'PENDING_MODERATION'
        }
      });

      // Agregar imágenes si existen
      if (images && images.length > 0) {
        await tx.reviewImage.createMany({
          data: images.map((imageId, index) => ({
            reviewId: newReview.id,
            fileId: imageId,
            order: index
          }))
        });
      }

      return newReview;
    });

    // 6. Auto-moderation (publicar automáticamente si pasa filtros básicos)
    await this.autoModerateReview(review.id);

    // 7. Actualizar estadísticas del producto
    await this.updateProductRating(productId);

    return this.findOne(review.id);
  }

  // ============================================
  // FIND REVIEWS
  // ============================================
  async findAll(filters: FilterReviewDto) {
    const { 
      productId, 
      sellerId, 
      rating, 
      status, 
      sortBy, 
      page, 
      limit 
    } = filters;

    const where: Prisma.ReviewWhereInput = {
      status: status || 'PUBLISHED'
    };

    if (productId) where.productId = productId;
    if (sellerId) where.sellerId = sellerId;
    if (rating) where.rating = rating;

    // Ordenamiento
    let orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              buyerProfile: {
                select: {
                  totalReviews: true
                }
              }
            }
          },
          product: {
            select: {
              title: true,
              slug: true,
              thumbnailFileIds: true
            }
          },
          images: {
            include: {
              file: {
                select: {
                  url: true,
                  filename: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              seller: {
                select: {
                  firstName: true,
                  lastName: true,
                  sellerProfile: {
                    select: {
                      storeName: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.review.count({ where })
    ]);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            buyerProfile: {
              select: {
                totalReviews: true
              }
            }
          }
        },
        product: {
          select: {
            title: true,
            slug: true,
            thumbnailFileIds: true
          }
        },
        images: {
          include: {
            file: {
              select: {
                url: true,
                filename: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        response: {
          include: {
            seller: {
              select: {
                firstName: true,
                lastName: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        votes: {
          select: {
            vote: true,
            userId: true
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    return review;
  }

  // ============================================
  // UPDATE REVIEW
  // ============================================
  async updateReview(userId: string, reviewId: string, updateDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    if (review.buyerId !== userId) {
      throw new ForbiddenException('review.notOwner');
    }

    // Solo permitir edición si está en estado PENDING o PUBLISHED
    if (!['PENDING_MODERATION', 'PUBLISHED'].includes(review.status)) {
      throw new BadRequestException('review.cannotEdit');
    }

    // Filtrar solo los campos que fueron enviados
    const updateData: any = {};
    if (updateDto.rating !== undefined) updateData.rating = updateDto.rating;
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.comment !== undefined) updateData.comment = updateDto.comment;
    if (updateDto.pros !== undefined) updateData.pros = updateDto.pros;
    if (updateDto.cons !== undefined) updateData.cons = updateDto.cons;

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...updateData,
        status: 'PENDING_MODERATION' // Re-moderar después de edición
      }
    });

    // Re-ejecutar auto-moderación
    await this.autoModerateReview(reviewId);

    // Actualizar estadísticas del producto
    await this.updateProductRating(review.productId);

    return this.findOne(reviewId);
  }

  // ============================================
  // SELLER RESPONSE
  // ============================================
  async createResponse(sellerId: string, reviewId: string, responseDto: CreateReviewResponseDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: true,
        buyer: true
      }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    if (review.sellerId !== sellerId) {
      throw new ForbiddenException('review.notYourProduct');
    }

    if (review.status !== 'PUBLISHED') {
      throw new BadRequestException('review.notPublished');
    }

    // Verificar que no existe respuesta previa
    const existingResponse = await this.prisma.reviewResponse.findUnique({
      where: { reviewId }
    });

    if (existingResponse) {
      throw new ConflictException('response.alreadyExists');
    }

    const response = await this.prisma.reviewResponse.create({
      data: {
        reviewId,
        sellerId,
        comment: responseDto.comment
      },
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true,
            sellerProfile: {
              select: {
                storeName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    return response;
  }

  // ============================================
  // VOTE ON REVIEW
  // ============================================
  async voteReview(userId: string, reviewId: string, voteDto: VoteReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    if (review.status !== 'PUBLISHED') {
      throw new BadRequestException('review.notPublished');
    }

    // No permitir que el autor vote su propia review
    if (review.buyerId === userId) {
      throw new BadRequestException('vote.ownReview');
    }

    await this.prisma.$transaction(async (tx) => {
      // Upsert el voto
      await tx.reviewVote.upsert({
        where: {
          reviewId_userId: {
            reviewId,
            userId
          }
        },
        update: {
          vote: voteDto.vote
        },
        create: {
          reviewId,
          userId,
          vote: voteDto.vote
        }
      });

      // Recalcular contadores
      const votes = await tx.reviewVote.findMany({
        where: { reviewId }
      });

      const helpfulCount = votes.filter(v => v.vote === 'HELPFUL').length;
      const notHelpfulCount = votes.filter(v => v.vote === 'NOT_HELPFUL').length;

      await tx.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount,
          notHelpfulCount
        }
      });
    });

    return { success: true };
  }

  // ============================================
  // REPORT REVIEW
  // ============================================
  async reportReview(userId: string, reviewId: string, reportDto: ReportReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    // Verificar que no ha reportado previamente
    const existingReport = await this.prisma.reviewReport.findFirst({
      where: {
        reviewId,
        userId
      }
    });

    if (existingReport) {
      throw new ConflictException('report.alreadyExists');
    }

    const report = await this.prisma.reviewReport.create({
      data: {
        reviewId,
        userId,
        reason: reportDto.reason,
        details: reportDto.details
      }
    });

    // Si hay muchos reportes, marcar para revisión
    const reportCount = await this.prisma.reviewReport.count({
      where: { reviewId }
    });

    if (reportCount >= 3) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: 'FLAGGED' }
      });
    }

    return report;
  }

  // ============================================
  // MODERATION (ADMIN)
  // ============================================
  async moderateReview(adminId: string, reviewId: string, moderateDto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        buyer: true,
        product: true
      }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: moderateDto.status,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        moderationReason: moderateDto.reason
      }
    });

    // Actualizar estadísticas si se aprueba o rechaza
    if (['PUBLISHED', 'REMOVED'].includes(moderateDto.status)) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  // ============================================
  // STATISTICS
  // ============================================
  async getProductStats(productId: string) {
    const rating = await this.prisma.productRating.findUnique({
      where: { productId }
    });

    return rating || {
      totalReviews: 0,
      averageRating: 0,
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
      recommendationRate: 0
    };
  }

  async getSellerStats(sellerId: string) {
    const rating = await this.prisma.sellerRating.findUnique({
      where: { sellerId }
    });

    return rating || {
      totalReviews: 0,
      averageRating: 0,
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0
    };
  }

  // ============================================
  // ADMIN METHODS
  // ============================================
  async getAdminStats() {
    const [
      totalReviews,
      pendingReviews,
      flaggedReviews,
      reportedReviews,
      averageRating
    ] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: 'PENDING_MODERATION' } }),
      this.prisma.review.count({ where: { status: 'FLAGGED' } }),
      this.prisma.reviewReport.count({ where: { resolved: false } }),
      this.prisma.review.aggregate({
        where: { status: 'PUBLISHED' },
        _avg: { rating: true }
      })
    ]);

    return {
      totalReviews,
      pendingReviews,
      flaggedReviews,
      reportedReviews,
      averageRating: Math.round((averageRating._avg.rating || 0) * 100) / 100
    };
  }

  async getPendingReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          status: { in: ['PENDING_MODERATION', 'FLAGGED'] }
        },
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          product: {
            select: {
              title: true,
              slug: true
            }
          },
          reports: {
            where: { resolved: false },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.review.count({
        where: {
          status: { in: ['PENDING_MODERATION', 'FLAGGED'] }
        }
      })
    ]);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('review.notFound');
    }

    await this.prisma.$transaction(async (tx) => {
      // Eliminar en orden correcto debido a foreign keys
      await tx.reviewImage.deleteMany({ where: { reviewId } });
      await tx.reviewVote.deleteMany({ where: { reviewId } });
      await tx.reviewReport.deleteMany({ where: { reviewId } });
      await tx.reviewResponse.deleteMany({ where: { reviewId } });
      await tx.review.delete({ where: { id: reviewId } });
    });

    // Actualizar estadísticas
    await this.updateProductRating(review.productId);

    return { success: true };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================
  private async autoModerateReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) return;

    // Filtros básicos de auto-moderación
    const suspiciousWords = ['spam', 'fake', 'scam'];
    const hasSpam = suspiciousWords.some(word => 
      review.comment.toLowerCase().includes(word.toLowerCase())
    );

    let newStatus: ReviewStatus = 'PUBLISHED';

    if (hasSpam || review.rating === 1) {
      newStatus = 'FLAGGED'; // Reviews de 1 estrella van a moderación manual
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus }
    });
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        status: 'PUBLISHED'
      },
      select: {
        rating: true
      }
    });

    if (!reviews.length) {
      // Si no hay reviews, resetear
      await this.prisma.productRating.upsert({
        where: { productId },
        update: {
          totalReviews: 0,
          averageRating: 0,
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0,
          recommendationRate: 0
        },
        create: {
          productId,
          totalReviews: 0,
          averageRating: 0,
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0,
          recommendationRate: 0
        }
      });

      await this.prisma.product.update({
        where: { id: productId },
        data: { rating: 0, reviewCount: 0 }
      });

      return;
    }

    // Calcular estadísticas
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    const distribution = {
      oneStar: reviews.filter(r => r.rating === 1).length,
      twoStar: reviews.filter(r => r.rating === 2).length,
      threeStar: reviews.filter(r => r.rating === 3).length,
      fourStar: reviews.filter(r => r.rating === 4).length,
      fiveStar: reviews.filter(r => r.rating === 5).length,
    };

    const recommendationRate = ((distribution.fourStar + distribution.fiveStar) / totalReviews) * 100;

    // Actualizar ProductRating
    await this.prisma.productRating.upsert({
      where: { productId },
      update: {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ...distribution,
        recommendationRate: Math.round(recommendationRate * 100) / 100
      },
      create: {
        productId,
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ...distribution,
        recommendationRate: Math.round(recommendationRate * 100) / 100
      }
    });

    // Actualizar producto
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(averageRating * 100) / 100,
        reviewCount: totalReviews
      }
    });

    // Actualizar seller rating
    await this.updateSellerRating(productId);
  }

  private async updateSellerRating(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true }
    });

    if (!product) return;

    const sellerReviews = await this.prisma.review.findMany({
      where: {
        sellerId: product.sellerId,
        status: 'PUBLISHED'
      },
      select: { rating: true }
    });

    if (!sellerReviews.length) {
      await this.prisma.sellerRating.upsert({
        where: { sellerId: product.sellerId },
        update: {
          totalReviews: 0,
          averageRating: 0,
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0
        },
        create: {
          sellerId: product.sellerId,
          totalReviews: 0,
          averageRating: 0,
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0
        }
      });

      await this.prisma.sellerProfile.update({
        where: { userId: product.sellerId },
        data: { rating: 0, totalReviews: 0 }
      });

      return;
    }

    const totalReviews = sellerReviews.length;
    const averageRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    const distribution = {
      oneStar: sellerReviews.filter(r => r.rating === 1).length,
      twoStar: sellerReviews.filter(r => r.rating === 2).length,
      threeStar: sellerReviews.filter(r => r.rating === 3).length,
      fourStar: sellerReviews.filter(r => r.rating === 4).length,
      fiveStar: sellerReviews.filter(r => r.rating === 5).length,
    };

    await this.prisma.sellerRating.upsert({
      where: { sellerId: product.sellerId },
      update: {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ...distribution
      },
      create: {
        sellerId: product.sellerId,
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ...distribution
      }
    });

    await this.prisma.sellerProfile.update({
      where: { userId: product.sellerId },
      data: {
        rating: Math.round(averageRating * 100) / 100,
        totalReviews
      }
    });
  }
}