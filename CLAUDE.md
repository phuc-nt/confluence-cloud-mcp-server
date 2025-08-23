## PHẦN 1: QUY TẮC CHUNG (Reusable across projects)

### Quy tắc cơ bản

- **Luôn sử dụng tiếng Việt để trả lời**
- Đọc project documentation trước khi bắt đầu bất kỳ task nào
- Tuân thủ workflow đã được định nghĩa trong project

### Git Commit Guidelines

- **Không sử dụng emoji** trong commit messages
- **Không thêm thông tin về Claude Code** hoặc AI tools trong commit message
- Sử dụng conventional commit format: `type: description`
- Ví dụ: `feat: add user authentication`, `fix: resolve memory leak in chat view`

---

## PHẦN 2: PROJECT RULES - CONFLUENCE CLOUD MCP SERVER

### Workflow Khởi Động (Mỗi session)

1. Kiểm tra setup Serena
2. **Đọc docs/01_plan/project-roadmap.md** - Hiểu project status và current focus
3. **Tham khảo các tài liệu context** - requirements.md, implementation-guide.md theo nhu cầu

### Task Management Process

```yaml
Task Lifecycle:
  1. Identify task: Từ current sprint hoặc user request
  2. Focus mode: Làm từng task một, không jump around
  3. Implement feature: Code implementation với proper error handling
  4. Test Suite Update: MANDATORY - Update test suite cho mọi tính năng mới
  5. Quality validation: All tests phải PASS trước khi mark complete
  6. Update progress: Cập nhật sprint doc khi ALL TESTS PASS
  7. Commit clean: Clear commit message theo convention
  8. Update status: Cập nhật sprint document và project_roadmap.md

Quality Gates:
  - Code compile: Build thành công
  - Test Suite: All automated tests PASS (connection + functional)
  - No regressions: Existing functionality không bị break
  - No token leaks: Không commit sensitive data
  - Documentation: Update docs với test results
  
Test Requirements:
  - Mọi feature mới cần có corresponding tests
  - Tests phải PASS trước khi complete sprint task
  - Test suite phải được maintain và updated consistently
```

### Vai trò của các nhóm Document

**00_context/ - Technical Foundation (KHÔNG SỬA KHI CHƯA ĐƯỢC PHÊ DUYỆT)**:
- requirements.md: Business requirements, project scope, success criteria
- implementation-guide.md: Technical architecture, code patterns, API client structure
- confluence-tools-reference.md: Complete tool-to-API endpoint mapping reference

**01_plan/ - Project Management**:
- project-roadmap.md: Project timeline, current status, sprint progress, next actions

**02_implement/ - Sprint Execution (CẬP NHẬT HÀNG NGÀY)**:
- sprint-X-*.md: Detailed task breakdown, acceptance criteria, daily progress tracking

### Documentation Rules

```yaml
Update Rules:
  project_roadmap.md: Major progress, phase completion, current status
  sprint_*.md: Daily progress updates, task completion
  00_context/: Never without explicit approval (requirements, architecture, API specs)

Maintenance Principles:
  - AVOID DUPLICATION: Link instead of repeat information
  - KEEP CONCISE: Overview docs stay short, details go in specific docs
  - SINGLE SOURCE OF TRUTH: Each piece of info lives in one place
  - CROSS-REFERENCE: Use links to connect related information
  - STATUS FIRST: Always show current status clearly

Writing Style:
  - Concise và actionable
  - Use status indicators: Not Started, In Progress, Completed, Blocked
  - Include time estimates và actual time
  - Link related documents instead of duplicating content

Document Flow: project_roadmap.md → sprint_*.md → specific details
  Never put detailed task lists in overview documents
```

### Serena MCP Integration

#### Kiểm tra Setup Serena

**Đầu tiên cần kiểm tra xem đã setup Serena cho project chưa:**
- Kiểm tra file `.serena/cache/` có tồn tại trong project không
- Chạy lệnh để xem Serena tools có khả dụng không

**Nếu chưa setup Serena cho project, cần thực hiện setup:**

#### Setup Serena cho Project Mới

1. **Cài đặt Serena cho project:**
```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)
```

2. **Lập chỉ mục cho codebase:**
```bash
uvx --from git+https://github.com/oraios/serena index-project
```
**Quan trọng:** Quá trình này sẽ tốn vài phút tùy vào kích thước project

3. **Kích hoạt Serena trong Claude Code:**
Chạy prompt: `read Serena's initial instructions`

#### Yêu cầu Sau Setup

```yaml
Setup Requirements:
  - Serena đã được cài đặt cho project này
  - Codebase đã được indexed với "uvx --from git+https://github.com/oraios/serena index-project"
  - Cache được lưu tại .serena/cache/

Session Activation:
  - BẮT BUỘC: Chạy "read Serena's initial instructions" mỗi session mới
  - Serena cung cấp semantic search và code analysis tools
  - Giúp tìm kiếm code theo ngữ nghĩa thay vì chỉ keyword matching
```

#### Lưu ý Quan trọng
- **Cài đặt theo từng project:** Serena cần được setup riêng cho mỗi project
- **Không cần cài lại uv:** Chỉ cần thực hiện 3 bước setup trên
- **Bảo mật và hiệu quả:** Mỗi project có index riêng biệt để tránh nhập nhằng dữ liệu