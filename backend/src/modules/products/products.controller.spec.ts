import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { UserRole } from '@prisma/client';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: UserRole.SELLER,
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findMyProducts: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publish: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 10,
        category: 'TABLES' as any,
        difficulty: 'INTERMEDIATE' as any,
      };

      const mockProduct = { id: 'test-id', ...createDto };
      service.create.mockResolvedValue(mockProduct as any);

      const result = await controller.create(createDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, createDto);
      expect(result).toBeDefined();
    });
  });
});
