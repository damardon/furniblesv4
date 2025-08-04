[{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo '(Without<UserCreateInput, UserUncheckedCreateInput> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput)'.\n  El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo 'Without<UserUncheckedCreateInput, UserCreateInput> & UserCreateInput'.\n    La propiedad \"password\" falta en el tipo \"{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }\", pero es obligatoria en el tipo \"UserCreateInput\".",
	"source": "ts",
	"startLineNumber": 12,
	"startColumn": 5,
	"endLineNumber": 12,
	"endColumn": 11,
	"relatedInformation": [
		{
			"startLineNumber": 52599,
			"startColumn": 5,
			"endLineNumber": 52599,
			"endColumn": 13,
			"message": "\"password\" se declara aquí.",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		},
		{
			"startLineNumber": 6195,
			"startColumn": 5,
			"endLineNumber": 6195,
			"endColumn": 11,
			"message": "El tipo esperado procede de la propiedad \"create\", que se declara aquí en el tipo \"{ select?: UserSelect<DefaultArgs> | null | undefined; omit?: UserOmit<DefaultArgs> | null | undefined; include?: UserInclude<DefaultArgs> | null | undefined; where: UserWhereUniqueInput; create: (Without<...> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput); update: (Without<...> & UserUncheckedUpdate...\"",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		}
	],
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo '(Without<UserCreateInput, UserUncheckedCreateInput> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput)'.\n  El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo 'Without<UserUncheckedCreateInput, UserCreateInput> & UserCreateInput'.\n    La propiedad \"password\" falta en el tipo \"{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }\", pero es obligatoria en el tipo \"UserCreateInput\".",
	"source": "ts",
	"startLineNumber": 47,
	"startColumn": 5,
	"endLineNumber": 47,
	"endColumn": 11,
	"relatedInformation": [
		{
			"startLineNumber": 52599,
			"startColumn": 5,
			"endLineNumber": 52599,
			"endColumn": 13,
			"message": "\"password\" se declara aquí.",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		},
		{
			"startLineNumber": 6195,
			"startColumn": 5,
			"endLineNumber": 6195,
			"endColumn": 11,
			"message": "El tipo esperado procede de la propiedad \"create\", que se declara aquí en el tipo \"{ select?: UserSelect<DefaultArgs> | null | undefined; omit?: UserOmit<DefaultArgs> | null | undefined; include?: UserInclude<DefaultArgs> | null | undefined; where: UserWhereUniqueInput; create: (Without<...> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput); update: (Without<...> & UserUncheckedUpdate...\"",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		}
	],
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo '(Without<UserCreateInput, UserUncheckedCreateInput> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput)'.\n  El tipo '{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }' no se puede asignar al tipo 'Without<UserUncheckedCreateInput, UserCreateInput> & UserCreateInput'.\n    La propiedad \"password\" falta en el tipo \"{ email: string; firstName: string; lastName: string; role: \"SELLER\"; emailVerified: true; isActive: true; status: \"ACTIVE\"; stripeConnectId: string; onboardingComplete: true; payoutsEnabled: true; chargesEnabled: true; sellerProfile: { ...; }; }\", pero es obligatoria en el tipo \"UserCreateInput\".",
	"source": "ts",
	"startLineNumber": 82,
	"startColumn": 5,
	"endLineNumber": 82,
	"endColumn": 11,
	"relatedInformation": [
		{
			"startLineNumber": 52599,
			"startColumn": 5,
			"endLineNumber": 52599,
			"endColumn": 13,
			"message": "\"password\" se declara aquí.",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		},
		{
			"startLineNumber": 6195,
			"startColumn": 5,
			"endLineNumber": 6195,
			"endColumn": 11,
			"message": "El tipo esperado procede de la propiedad \"create\", que se declara aquí en el tipo \"{ select?: UserSelect<DefaultArgs> | null | undefined; omit?: UserOmit<DefaultArgs> | null | undefined; include?: UserInclude<DefaultArgs> | null | undefined; where: UserWhereUniqueInput; create: (Without<...> & UserUncheckedCreateInput) | (Without<...> & UserCreateInput); update: (Without<...> & UserUncheckedUpdate...\"",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		}
	],
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "La propiedad 'LIVING_DINING' no existe en el tipo '{ FURNITURE: \"FURNITURE\"; CHAIRS: \"CHAIRS\"; TABLES: \"TABLES\"; BEDS: \"BEDS\"; STORAGE: \"STORAGE\"; OUTDOOR: \"OUTDOOR\"; DECORATIVE: \"DECORATIVE\"; KITCHEN: \"KITCHEN\"; OFFICE: \"OFFICE\"; }'.",
	"source": "ts",
	"startLineNumber": 121,
	"startColumn": 33,
	"endLineNumber": 121,
	"endColumn": 46,
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "La propiedad 'LIVING_DINING' no existe en el tipo '{ FURNITURE: \"FURNITURE\"; CHAIRS: \"CHAIRS\"; TABLES: \"TABLES\"; BEDS: \"BEDS\"; STORAGE: \"STORAGE\"; OUTDOOR: \"OUTDOOR\"; DECORATIVE: \"DECORATIVE\"; KITCHEN: \"KITCHEN\"; OFFICE: \"OFFICE\"; }'.",
	"source": "ts",
	"startLineNumber": 157,
	"startColumn": 33,
	"endLineNumber": 157,
	"endColumn": 46,
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "La propiedad 'NORDIC' no existe en el tipo '{ FURNITURE: \"FURNITURE\"; CHAIRS: \"CHAIRS\"; TABLES: \"TABLES\"; BEDS: \"BEDS\"; STORAGE: \"STORAGE\"; OUTDOOR: \"OUTDOOR\"; DECORATIVE: \"DECORATIVE\"; KITCHEN: \"KITCHEN\"; OFFICE: \"OFFICE\"; }'.",
	"source": "ts",
	"startLineNumber": 191,
	"startColumn": 33,
	"endLineNumber": 191,
	"endColumn": 39,
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "La propiedad 'ORGANIZATION' no existe en el tipo '{ FURNITURE: \"FURNITURE\"; CHAIRS: \"CHAIRS\"; TABLES: \"TABLES\"; BEDS: \"BEDS\"; STORAGE: \"STORAGE\"; OUTDOOR: \"OUTDOOR\"; DECORATIVE: \"DECORATIVE\"; KITCHEN: \"KITCHEN\"; OFFICE: \"OFFICE\"; }'.",
	"source": "ts",
	"startLineNumber": 225,
	"startColumn": 33,
	"endLineNumber": 225,
	"endColumn": 45,
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; } | { ...; } | { ...; } | { ...; }' no se puede asignar al tipo '(Without<ProductUpdateInput, ProductUncheckedUpdateInput> & ProductUncheckedUpdateInput) | (Without<...> & ProductUpdateInput)'.\n  El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; }' no se puede asignar al tipo '(Without<ProductUpdateInput, ProductUncheckedUpdateInput> & ProductUncheckedUpdateInput) | (Without<...> & ProductUpdateInput)'.\n    El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; }' no se puede asignar al tipo 'Without<ProductUpdateInput, ProductUncheckedUpdateInput> & ProductUncheckedUpdateInput'.\n      Los tipos de propiedad 'tags' no son compatibles.\n        El tipo 'string[]' no se puede asignar al tipo 'string | StringFieldUpdateOperationsInput | undefined'.",
	"source": "ts",
	"startLineNumber": 294,
	"startColumn": 7,
	"endLineNumber": 294,
	"endColumn": 13,
	"relatedInformation": [
		{
			"startLineNumber": 19163,
			"startColumn": 5,
			"endLineNumber": 19163,
			"endColumn": 11,
			"message": "El tipo esperado procede de la propiedad \"update\", que se declara aquí en el tipo \"{ select?: ProductSelect<DefaultArgs> | null | undefined; omit?: ProductOmit<DefaultArgs> | null | undefined; include?: ProductInclude<...> | ... 1 more ... | undefined; where: ProductWhereUniqueInput; create: (Without<...> & ProductUncheckedCreateInput) | (Without<...> & ProductCreateInput); update: (Without<...> &...\"",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		}
	],
	"origin": "extHost2"
},{
	"resource": "/workspaces/furniblesv4/backend/prisma/seed-products.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; } | { ...; } | { ...; } | { ...; }' no se puede asignar al tipo '(Without<ProductCreateInput, ProductUncheckedCreateInput> & ProductUncheckedCreateInput) | (Without<...> & ProductCreateInput)'.\n  El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; }' no se puede asignar al tipo '(Without<ProductCreateInput, ProductUncheckedCreateInput> & ProductUncheckedCreateInput) | (Without<...> & ProductCreateInput)'.\n    El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; }' no se puede asignar al tipo 'Without<ProductCreateInput, ProductUncheckedCreateInput> & ProductUncheckedCreateInput'.\n      El tipo '{ title: string; description: string; slug: string; price: number; category: any; difficulty: \"INTERMEDIATE\"; pdfUrl: string; pdfFileId: string; previewImages: string[]; thumbnails: string[]; tags: string[]; ... 12 more ...; reviewCount: number; }' no se puede asignar al tipo 'ProductUncheckedCreateInput'.\n        Los tipos de propiedad 'tags' no son compatibles.\n          El tipo 'string[]' no se puede asignar al tipo 'string'.",
	"source": "ts",
	"startLineNumber": 295,
	"startColumn": 7,
	"endLineNumber": 295,
	"endColumn": 13,
	"relatedInformation": [
		{
			"startLineNumber": 19159,
			"startColumn": 5,
			"endLineNumber": 19159,
			"endColumn": 11,
			"message": "El tipo esperado procede de la propiedad \"create\", que se declara aquí en el tipo \"{ select?: ProductSelect<DefaultArgs> | null | undefined; omit?: ProductOmit<DefaultArgs> | null | undefined; include?: ProductInclude<...> | ... 1 more ... | undefined; where: ProductWhereUniqueInput; create: (Without<...> & ProductUncheckedCreateInput) | (Without<...> & ProductCreateInput); update: (Without<...> &...\"",
			"resource": "/workspaces/furniblesv4/node_modules/.prisma/client/index.d.ts"
		}
	],
	"origin": "extHost2"
}]