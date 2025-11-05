# Clean Architecture UML Diagrams

Tài liệu này chứa các sơ đồ UML mô tả kiến trúc Clean Architecture của dự án.

## Các file sơ đồ

### 1. `clean-architecture-diagram.puml`
**Mô tả:** Sơ đồ tổng quan toàn bộ kiến trúc với tất cả các components, classes, và dependencies.

**Bao gồm:**
- Presentation Layer: Pages, Hooks, Components
- Domain Layer: Entities, Use Cases, Repository Interfaces
- Infrastructure Layer: Repositories, Adapters, External Services
- Tất cả dependencies giữa các layers

**Cách xem:**
- Sử dụng PlantUML extension trong VS Code
- Hoặc render online tại: http://www.plantuml.com/plantuml/uml/
- Hoặc sử dụng PlantUML CLI

### 2. `clean-architecture-flow.puml`
**Mô tả:** Sơ đồ sequence diagram mô tả luồng hoạt động của một CRUD operation (ví dụ: Create Project).

**Bao gồm:**
- Luồng từ User đến Database
- Các bước xử lý qua từng layer
- Trách nhiệm của từng component

**Cách xem:**
- Tương tự như file 1

### 3. `clean-architecture-layers.puml`
**Mô tả:** Sơ đồ đơn giản về cấu trúc 3 layers chính.

**Bao gồm:**
- Presentation Layer
- Domain Layer
- Infrastructure Layer
- Dependencies giữa các layers

**Cách xem:**
- Tương tự như file 1

## Cách sử dụng

### Option 1: VS Code với PlantUML Extension
1. Cài đặt extension "PlantUML" trong VS Code
2. Mở file `.puml`
3. Nhấn `Alt + D` để preview
4. Hoặc click vào icon preview ở góc trên bên phải

### Option 2: PlantUML Online
1. Mở file `.puml`
2. Copy toàn bộ nội dung
3. Vào http://www.plantuml.com/plantuml/uml/
4. Paste code vào
5. Xem kết quả

### Option 3: PlantUML CLI
```bash
# Cài đặt PlantUML (cần Java)
# Windows: Download từ http://plantuml.com/download
# Mac: brew install plantuml
# Linux: sudo apt-get install plantuml

# Generate PNG
plantuml docs/clean-architecture-diagram.puml

# Generate SVG
plantuml -tsvg docs/clean-architecture-diagram.puml
```

## Cấu trúc Clean Architecture

### Presentation Layer (React)
- **Pages**: React components (Projects.jsx, Sales.jsx, etc.)
- **Hooks**: Custom hooks (useProjects, useSales, etc.)
- **Components**: Reusable UI components (Toaster, ConfirmDialog)

### Domain Layer (Business Logic)
- **Entities**: Pure business objects (Project, Sale, Location, etc.)
- **Use Cases**: Business logic orchestration (CreateProjectUseCase, etc.)
- **Repository Interfaces**: Abstract contracts (IProjectsRepository, etc.)

### Infrastructure Layer (External Services)
- **Repository Adapters**: Connect Domain interfaces to Infrastructure
- **Repositories**: Concrete implementations (projectsRepository, etc.)
- **External Services**: Firebase, Firestore

## Dependency Rule

**Dependencies luôn chỉ vào trong (inward):**

```
Presentation → Domain → Infrastructure
```

- Domain Layer **KHÔNG** phụ thuộc vào bất kỳ layer nào
- Infrastructure Layer implement Domain interfaces
- Presentation Layer sử dụng Domain Use Cases

## Ví dụ luồng hoạt động

### Create Project Flow:
1. User nhập form trong `ProjectsPage`
2. `ProjectsPage` gọi `useProjects` hook
3. `useProjects` hook gọi `createProjectUseCase` từ `useCasesService`
4. `CreateProjectUseCase` tạo `Project` entity và validate
5. `CreateProjectUseCase` gọi `IProjectsRepository` interface
6. `ProjectsRepositoryAdapter` implement interface và gọi `projectsRepository`
7. `projectsRepository` lưu vào Firebase Firestore
8. Kết quả trả về ngược lại qua các layers
9. UI được cập nhật và hiển thị toast message

## Lưu ý

- Tất cả dependencies đều tuân thủ Dependency Inversion Principle
- Domain Layer hoàn toàn độc lập, không phụ thuộc vào framework
- Infrastructure có thể thay đổi (Firebase → MongoDB, etc.) mà không ảnh hưởng Domain
- Presentation có thể thay đổi (React → Vue, etc.) mà không ảnh hưởng Domain

