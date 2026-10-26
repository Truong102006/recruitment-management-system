import {
  expandLocationVariants,
  removeVietnameseDiacritics,
} from '../utils/location-filter.util';
import { JobQueryRepository } from '../repositories/job-query.repository';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('Job Location Filter Utility & Repository', () => {
  describe('expandLocationVariants', () => {
    it('mở rộng biến thể cho "Hồ Chí Minh" bao gồm cả có dấu, không dấu và alias tiếng Anh', () => {
      const variants = expandLocationVariants('Hồ Chí Minh');
      const lower = variants.map((v) => v.toLowerCase());

      expect(lower).toContain('hồ chí minh');
      expect(lower).toContain('ho chi minh');
      expect(lower).toContain('ho chi minh city');
      expect(lower).toContain('tp.hcm');
      expect(lower).toContain('saigon');
    });

    it('mở rộng biến thể cho "Hà Nội"', () => {
      const variants = expandLocationVariants('Hà Nội');
      const lower = variants.map((v) => v.toLowerCase());

      expect(lower).toContain('hà nội');
      expect(lower).toContain('ha noi');
      expect(lower).toContain('hanoi');
      expect(lower).toContain('ha noi city');
    });

    it('mở rộng biến thể cho nhiều tỉnh thành phố phân tách bởi dấu phẩy', () => {
      const variants = expandLocationVariants('Hồ Chí Minh, Hà Nội');
      const lower = variants.map((v) => v.toLowerCase());

      expect(lower).toContain('ho chi minh city');
      expect(lower).toContain('ha noi');
    });

    it('trả về rỗng nếu chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
      expect(expandLocationVariants('')).toEqual([]);
      expect(expandLocationVariants('   ')).toEqual([]);
    });

    it('removeVietnameseDiacritics chuẩn hóa chuỗi tiếng Việt', () => {
      expect(removeVietnameseDiacritics('Đà Nẵng')).toBe('da nang');
      expect(removeVietnameseDiacritics('Bà Rịa - Vũng Tàu')).toBe('ba ria - vung tau');
    });
  });

  describe('JobQueryRepository location filtering query assembly', () => {
    let repo: JobQueryRepository;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        jobPost: {
          count: jest.fn().mockResolvedValue(1),
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'job-1',
              title: 'Backend Engineer',
              location: 'Ho Chi Minh City',
              company: { name: 'Acme Corp' },
              skills: [],
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ]),
        },
      };
      repo = new JobQueryRepository(mockPrisma as PrismaService);
    });

    it('tạo điều kiện Prisma where chứa OR cho các biến thể location khi lọc "Hồ Chí Minh"', async () => {
      await repo.searchPublicJobs({ location: 'Hồ Chí Minh' });

      expect(mockPrisma.jobPost.findMany).toHaveBeenCalled();
      const whereArg = mockPrisma.jobPost.findMany.mock.calls[0][0].where;

      expect(whereArg.AND).toBeDefined();
      const locationCondition = whereArg.AND.find((cond: any) => cond.OR && cond.OR[0]?.location);
      expect(locationCondition).toBeDefined();

      const locationsInOr = locationCondition.OR.map((item: any) => item.location.contains.toLowerCase());
      expect(locationsInOr).toContain('ho chi minh city');
      expect(locationsInOr).toContain('hồ chí minh');
      expect(locationsInOr).toContain('ho chi minh');
    });

    it('kết hợp cả từ khóa tìm kiếm (q) và location mà không bị ghi đè lẫn nhau', async () => {
      await repo.searchPublicJobs({ q: 'Backend', location: 'Hồ Chí Minh' });

      const whereArg = mockPrisma.jobPost.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toBeDefined();

      // Có condition cho q
      const qCondition = whereArg.AND.find((cond: any) => cond.OR && cond.OR[0]?.title);
      expect(qCondition).toBeDefined();

      // Có condition cho location
      const locCondition = whereArg.AND.find((cond: any) => cond.OR && cond.OR[0]?.location);
      expect(locCondition).toBeDefined();
    });
  });
});
