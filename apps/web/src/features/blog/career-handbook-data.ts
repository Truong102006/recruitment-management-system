export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  categorySlug: string;
  categoryName: string;
  author: string;
  publishedAt: string;
  readingMinutes: number;
  imageUrl: string;
  isFeatured?: boolean;
}

export interface BlogCategory {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  heroSubtitle: string;
  iconName: string;
}

export const CAREER_CATEGORIES: BlogCategory[] = [
  {
    slug: 'huong-nghiep',
    name: 'Định hướng nghề nghiệp',
    shortName: 'Định hướng nghề nghiệp',
    description: 'Chia sẻ thông tin và kiến thức cần thiết giúp bạn sớm định hướng được nghề nghiệp, tìm được công việc phù hợp với sở thích và năng lực của bản thân.',
    heroSubtitle: 'Chia sẻ thông tin và kiến thức cần thiết giúp bạn sớm định hướng được nghề nghiệp, tìm được công việc phù hợp với sở thích và năng lực của bản thân.',
    iconName: 'compass',
  },
  {
    slug: 'bi-kip-tim-viec',
    name: 'Bí kíp tìm việc',
    shortName: 'Bí kíp tìm việc',
    description: 'Cẩm nang viết CV chuyên nghiệp, kỹ năng phỏng vấn, trả lời câu hỏi hóc búa và bí quyết thu hút nhà tuyển dụng.',
    heroSubtitle: 'Tổng hợp mẹo hay viết CV, phỏng vấn tự tin và kỹ năng đàm phán giúp bạn nhanh chóng chinh phục công việc mơ ước.',
    iconName: 'lightbulb',
  },
  {
    slug: 'che-do-luong-thuong',
    name: 'Chế độ lương thưởng',
    shortName: 'Chế độ lương thưởng',
    description: 'Cập nhật mặt bằng lương các ngành nghề, quy định bảo hiểm, thuế TNCN và quyền lợi người lao động mới nhất.',
    heroSubtitle: 'Khám phá báo cáo lương thưởng minh bạch, cách tính lương Net - Gross và quy định chế độ phúc lợi lao động.',
    iconName: 'currency',
  },
  {
    slug: 'kien-thuc-chuyen-nganh',
    name: 'Kiến thức chuyên ngành',
    shortName: 'Kiến thức chuyên ngành',
    description: 'Kiến thức cốt lõi và xu hướng chuyên sâu trong ngành Công nghệ thông tin, Thiết kế, Quản lý sản phẩm và Kinh doanh.',
    heroSubtitle: 'Cập nhật kiến thức chuyên môn, tài liệu thực chiến và xu hướng công nghệ hàng đầu dành cho nhân lực số.',
    iconName: 'book',
  },
  {
    slug: 'hanh-trang-nghe-nghiep',
    name: 'Hành trang nghề nghiệp',
    shortName: 'Hành trang nghề nghiệp',
    description: 'Phát triển kỹ năng mềm, phương pháp quản lý thời gian, văn hóa ứng xử công sở và tư duy phát triển bền vững.',
    heroSubtitle: 'Bộ kỹ năng mềm thiết yếu, năng lực lãnh đạo và tư duy phát triển giúp bạn bứt phá trong môi trường doanh nghiệp.',
    iconName: 'briefcase',
  },
  {
    slug: 'thi-truong-tuyen-dung',
    name: 'Thị trường & xu hướng tuyển dụng',
    shortName: 'Thị trường và xu hướng tuyển dụng',
    description: 'Phân tích báo cáo thị trường lao động, xu hướng AI, nhu cầu nhân lực công nghệ cao và dự báo ngành nghề tương lai.',
    heroSubtitle: 'Dữ liệu phân tích chuyên sâu về làn sóng tuyển dụng, dịch chuyển nhân sự và cơ hội việc làm thời đại chuyển đổi số.',
    iconName: 'trending',
  },
];

export const BLOG_ARTICLES: BlogArticle[] = [
  // 1. Featured articles shown in dropdown
  {
    id: 'art-001',
    slug: 'nhan-vien-ban-hang-la-gi-mo-ta-cong-viec',
    title: 'Nhân viên bán hàng là gì? Bảng mô tả công việc nhân viên bán hàng',
    excerpt: 'Nhân viên bán hàng là một vị trí HOT đang được rất nhiều người quan tâm theo đuổi. Để trở thành chuyên viên bán hàng xuất sắc, bạn cần trang bị kỹ năng gì?',
    categorySlug: 'huong-nghiep',
    categoryName: 'Định hướng nghề nghiệp',
    author: 'Ban Biên Tập Talento',
    publishedAt: '24/10/2026',
    readingMinutes: 6,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    content: [
      'Nhân viên bán hàng (Sales Representative / Sales Executive) là cầu nối then chốt giữa doanh nghiệp và khách hàng. Đây là vị trí trực tiếp mang lại doanh thu và định hình trải nghiệm của người tiêu dùng về sản phẩm/dịch vụ.',
      'Mô tả công việc chi tiết của nhân viên bán hàng:',
      '- Tìm kiếm và tiếp cận khách hàng tiềm năng qua các kênh trực tiếp và kỹ thuật số.',
      '- Tư vấn giải pháp phù hợp với nhu cầu và ngân sách của khách hàng.',
      '- Đàm phán điều khoản hợp đồng và chốt đơn hàng hiệu quả.',
      '- Chăm sóc khách hàng sau bán và mở rộng mạng lưới khách hàng trung thành.',
      'Để phát triển bền vững trong nghề bán hàng, khả năng lắng nghe thấu hiểu (Active Listening) và tư duy giải quyết vấn đề còn quan trọng hơn cả tài ăn nói.'
    ],
  },
  {
    id: 'art-002',
    slug: 'kham-pha-muc-luong-ke-toan-moi-nhat',
    title: 'Khám phá mức lương Kế toán mới nhất',
    excerpt: 'Kế toán là vị trí quan trọng trong bất kỳ công ty nào. Dù quy mô nhỏ hay tập đoàn lớn cũng đều cần bộ phận tài chính kế toán vững vàng.',
    categorySlug: 'che-do-luong-thuong',
    categoryName: 'Chế độ lương thưởng',
    author: 'Chuyên gia Lương thưởng Talento',
    publishedAt: '23/10/2026',
    readingMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    content: [
      'Nghề kế toán luôn nằm trong top các ngành có nhu cầu tuyển dụng ổn định nhất trên thị trường việc làm. Mức thu nhập ngành này có sự phân hóa rõ nét dựa vào kinh nghiệm, chứng chỉ chuyên môn (ACCA, CPA, CMA) và năng lực ngoại ngữ.',
      'Bảng lương tham khảo theo cấp bậc năm 2026:',
      '- Thực tập sinh / Kế toán mới ra trường: 6.000.000 - 9.000.000 VNĐ/tháng.',
      '- Kế toán viên có 2 - 4 năm kinh nghiệm: 12.000.000 - 18.000.000 VNĐ/tháng.',
      '- Kế toán tổng hợp: 18.000.000 - 28.000.000 VNĐ/tháng.',
      '- Kế toán trưởng / Giám đốc tài chính (CFO): 35.000.000 - 80.000.000+ VNĐ/tháng.',
      'Thành thạo phần mềm ERP, dữ liệu lớn và am hiểu luật thuế quốc tế là chìa khóa giúp kế toán gia tăng thu nhập vượt bậc.'
    ],
  },
  // 2. Additional rich articles for 'huong-nghiep' (matching Image 3)
  {
    id: 'art-003',
    slug: 'nganh-marketing-la-gi-co-hoi-viec-lam',
    title: 'Ngành Marketing là gì? Cơ hội việc làm và lộ trình thăng tiến',
    excerpt: 'Marketing đóng vai trò cốt lõi trong kỷ nguyên số. Cùng tìm hiểu các nhánh Marketing nổi bật như Digital Marketing, Content, Brand, Performance và mức thu nhập hấp dẫn.',
    categorySlug: 'huong-nghiep',
    categoryName: 'Định hướng nghề nghiệp',
    author: 'Nguyễn Minh Anh - Growth Lead',
    publishedAt: '25/10/2026',
    readingMinutes: 7,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    content: [
      'Marketing là tổng hợp các hoạt động hướng tới việc thỏa mãn nhu cầu và mong muốn của khách hàng thông qua quá trình trao đổi sản phẩm và giá trị.',
      'Trong thời đại bùng nổ AI, Digital Marketing chuyển dịch mạnh mẽ sang tiếp thị cá nhân hóa dựa trên dữ liệu (Data-driven Marketing).',
      'Các vị trí công việc thịnh hành:',
      '1. Digital Marketing Specialist: Vận hành chiến dịch đa kênh Google, Meta, TikTok.',
      '2. Content & Creative Strategist: Sáng tạo nội dung chạm cảm xúc và xây dựng thương hiệu.',
      '3. SEO/SEM Specialist: Tối ưu hóa thứ hạng tìm kiếm và chuyển đổi tự nhiên.',
      '4. Marketing Automation & CRM: Quản trị trải nghiệm khách hàng tự động.'
    ],
  },
  {
    id: 'art-004',
    slug: 'lo-trinh-tro-thanh-lap-trinh-vien-fullstack',
    title: 'Lộ trình từ con số 0 trở thành Lập trình viên Fullstack đón đầu làn sóng AI',
    excerpt: 'Cẩm nang chi tiết lộ trình học tập, các công nghệ cần nắm vững từ React, Node.js đến Cloud & AI integration giúp bạn tự tin ứng tuyển mọi công ty phần mềm.',
    categorySlug: 'huong-nghiep',
    categoryName: 'Định hướng nghề nghiệp',
    author: 'Trần Vũ Hoàng - Principal Architect',
    publishedAt: '22/10/2026',
    readingMinutes: 9,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    content: [
      'Lập trình viên Fullstack ngày nay không chỉ đơn thuần là biết cả Frontend lẫn Backend, mà còn là người có tư duy kiến trúc toàn diện và khả năng cộng tác cùng AI Agents.',
      'Giai đoạn 1: Nền tảng cốt lõi (TypeScript, Kiến trúc hướng đối tượng, SQL & Data Modeling).',
      'Giai đoạn 2: Hiện đại hóa Frontend (React 19, Next.js, Vite, Clean UI & Accessibility).',
      'Giai đoạn 3: Vững chắc Backend (NestJS, REST & GraphQL, Microservices, Message Brokers như Kafka/RabbitMQ).',
      'Giai đoạn 4: Triển khai & Vận hành (Docker, Kubernetes, CI/CD và Observability).'
    ],
  },
  {
    id: 'art-005',
    slug: 'bi-quyet-viet-cv-it-chinh-phuc-nha-tuyen-dung',
    title: '10 Lỗi sai kinh điển trên CV IT khiến 90% ứng viên bị loại từ vòng gửi xe',
    excerpt: 'Hầu hết ứng viên công nghệ thường quá tập trung vào liệt kê công nghệ mà quên mất số liệu đo lường tác động (Impact metrics). Khắc phục ngay các lỗi này!',
    categorySlug: 'bi-kip-tim-viec',
    categoryName: 'Bí kíp tìm việc',
    author: 'Vũ Thu Trang - Senior Tech Recruiter',
    publishedAt: '24/10/2026',
    readingMinutes: 6,
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
    content: [
      'Công thức XYZ của Google là bí quyết vàng khi viết CV: Accomplished [X] as measured by [Y], by doing [Z].',
      'Ví dụ: Thay vì viết "Lập trình API cho ứng dụng", hãy viết: "Thiết kế lại 14 endpoints API bằng NestJS và Redis Cache, giảm độ trễ phản hồi từ 420ms xuống 65ms và phục vụ 100.000 người dùng hoạt động mỗi ngày".'
    ],
  },
  {
    id: 'art-006',
    slug: 'cach-tinh-luong-gross-sang-net-chuan-xac-2026',
    title: 'Cách tính lương Gross sang Net và lưu ý về các khoản giảm trừ gia cảnh 2026',
    excerpt: 'Hiểu rõ sự khác biệt giữa lương Gross và lương Net giúp bạn tự tin đàm phán hợp đồng lao động mà không lo bị thiệt thòi về quyền lợi bảo hiểm và thuế.',
    categorySlug: 'che-do-luong-thuong',
    categoryName: 'Chế độ lương thưởng',
    author: 'Luật sư Lê Văn Hưng',
    publishedAt: '21/10/2026',
    readingMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    content: [
      'Lương Gross là tổng thu nhập trước khi trừ các khoản đóng bảo hiểm bắt buộc và thuế TNCN.',
      'Lương Net là số tiền thực tế bạn nhận về tài khoản ngân hàng mỗi kỳ trả lương.',
      'Các tỷ lệ trích nộp bảo hiểm bắt buộc người lao động đóng:',
      '- Bảo hiểm xã hội: 8%',
      '- Bảo hiểm y tế: 1.5%',
      '- Bảo hiểm thất nghiệp: 1%'
    ],
  },
  {
    id: 'art-007',
    slug: 'kien-thuc-clean-architecture-trong-du-an-thuc-te',
    title: 'Ứng dụng Clean Architecture và Domain-Driven Design trong hệ thống phần mềm lớn',
    excerpt: 'Tại sao các hệ thống Enterprise luôn ưu tiên Clean Architecture? Cách phân tầng Domain, Application, Infrastructure và Presentation tách biệt nghiệp vụ rõ ràng.',
    categorySlug: 'kien-thuc-chuyen-nganh',
    categoryName: 'Kiến thức chuyên ngành',
    author: 'Nguyễn Thành Đạt - Principal Engineer',
    publishedAt: '20/10/2026',
    readingMinutes: 8,
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    content: [
      'Clean Architecture giúp hệ thống độc lập với Framework, UI, Database và mọi tác nhân ngoại vi. Nghiệp vụ cốt lõi nằm ở trung tâm và có thể kiểm thử độc lập mà không cần khởi động database hay web server.'
    ],
  },
  {
    id: 'art-008',
    slug: 'ky-nang-giao-tiep-va-quan-ly-xung-dot-tai-noi-lam-viec',
    title: 'Nghệ thuật giao tiếp công sở: Cách giải quyết bất đồng quan điểm văn minh',
    excerpt: 'Kỹ năng làm việc nhóm và giải quyết mâu thuẫn là yếu tố quyết định 85% khả năng được thăng tiến lên các vị trí quản lý và lãnh đạo cấp cao.',
    categorySlug: 'hanh-trang-nghe-nghiep',
    categoryName: 'Hành trang nghề nghiệp',
    author: 'Phạm Minh Châu - HR Director',
    publishedAt: '19/10/2026',
    readingMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    content: [
      'Bất đồng quan điểm là điều tất yếu trong môi trường làm việc sáng tạo. Người chuyên nghiệp biết tập trung vào mục tiêu chung và giải pháp thay vì công kích cá nhân.'
    ],
  },
  {
    id: 'art-009',
    slug: 'bao-cao-thi-truong-viec-lam-cong-nghe-2026',
    title: 'Báo cáo thị trường nhân lực số 2026: Vị trí nào được săn đón nhiều nhất?',
    excerpt: 'AI Engineer, Cloud DevOps và Fullstack Developer tiếp tục dẫn đầu về nhu cầu tuyển dụng và mức tăng trưởng lương ấn tượng trong năm 2026.',
    categorySlug: 'thi-truong-tuyen-dung',
    categoryName: 'Thị trường & xu hướng tuyển dụng',
    author: 'Trung tâm Nghiên cứu Thị trường Talento',
    publishedAt: '25/10/2026',
    readingMinutes: 7,
    imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80',
    content: [
      'Báo cáo từ hơn 10.000 doanh nghiệp đối tác của Talento cho thấy nhu cầu tuyển dụng nhân sự có khả năng ứng dụng AI vào quy trình làm việc tăng 240% so với cùng kỳ năm trước.'
    ],
  },
];
