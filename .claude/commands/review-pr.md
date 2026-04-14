# Review Pull Request

Review a pull request for security, architecture, and code quality issues before merging.

## Input Parameters
- `prUrl` - Full GitHub PR URL (e.g., `https://github.com/org/repo/pull/123`)
- `checkSecurity` - Check for security vulnerabilities (default: true)
- `checkMultiTenancy` - Check for multi-tenancy leaks (default: true)
- `checkTests` - Check for test coverage (default: true)
- `checkRTL` - Check for RTL issues (default: true)

## Steps

### 1. Fetch PR details
```bash
# Get PR diff and metadata
gh pr view {PR_NUMBER} --json commits,files,title,body,author
gh pr diff {PR_NUMBER}
```

### 2. Create review checklist

Use this comprehensive checklist for all changes:

```markdown
## Security Review

### General Security
- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] No sensitive data in logs (ID numbers, emails, bank details, passwords)
- [ ] No SQL injection vulnerabilities (all queries use parameterized/ORM)
- [ ] No XSS vulnerabilities (HTML entities escaped, no innerHTML with user input)
- [ ] No XXE vulnerabilities (XML parsers configured safely)
- [ ] Input validation on all routes (class-validator decorators present)
- [ ] Rate limiting on public endpoints (@nestjs/throttler decorator)
- [ ] CORS configured correctly (whitelist only NEXT_PUBLIC_API_URL)

### Multi-Tenancy & Data Isolation
- [ ] All queries have `where: { organizationId }` clause
- [ ] organizationId comes from user context, never from request body
- [ ] No cross-organization data exposure possible
- [ ] User organizationId verified before any read/write operation
- [ ] Soft-deleted records excluded from all queries (`where: { deletedAt: null }`)
- [ ] No ability to query/modify other org's data

### Delete Operations
- [ ] No `prisma.*.delete()` calls (must use soft delete)
- [ ] All deletes use `update({ data: { deletedAt: new Date() } })`
- [ ] Soft-deleted records never returned in API responses
- [ ] Only hard delete in Prisma if specifically requested for data cleanup

### Authentication & Authorization
- [ ] All protected routes have @UseGuards(JwtAuthGuard)
- [ ] Role-based access control where needed @UseGuards(RolesGuard)
- [ ] JWT tokens contain organizationId and userId
- [ ] No authentication bypass possible
- [ ] Refresh token rotation implemented if refreshing tokens
- [ ] No exposure of internal user IDs in public responses

## Code Quality Review

### TypeScript
- [ ] No `any` types (use unknown or specific types)
- [ ] Strict mode enabled (`"strict": true` in tsconfig)
- [ ] No implicit `any`
- [ ] All function parameters typed
- [ ] All function return types specified
- [ ] No unused variables or imports

### Backend (NestJS)

#### DTOs & Validation
- [ ] All DTOs use class-validator decorators
- [ ] @ApiProperty decorators present on DTO fields
- [ ] Hebrew descriptions in @ApiProperty
- [ ] Validation decorators match field semantics
- [ ] No `validate: false` bypasses

#### API Endpoints
- [ ] All endpoints documented with @ApiOperation
- [ ] @ApiResponse decorators for success/error cases
- [ ] @ApiTags applied to controller class
- [ ] @ApiBearerAuth on protected endpoints
- [ ] Response shape documented (data, meta, error)
- [ ] No console.log in production code

#### Service Layer
- [ ] Logger injected and used on entry/exit
- [ ] Error stack traces logged without sensitive data
- [ ] Service methods have single responsibility
- [ ] No business logic in controllers
- [ ] All database queries in service layer

#### Tests
- [ ] Controller spec exists and tests all routes
- [ ] Service spec exists and tests all methods
- [ ] Tests verify organizationId scoping
- [ ] Tests verify soft delete behavior
- [ ] Tests verify 404/unauthorized responses
- [ ] Coverage >= 70% on new/changed files
- [ ] No skipped tests (no `.only`, `.skip`)
- [ ] Mocks properly reset in beforeEach/afterEach

### Frontend (Next.js/React)

#### Components
- [ ] Server components by default (no unnecessary `"use client"`)
- [ ] Props are properly typed with TypeScript
- [ ] No prop drilling (use context or composition)
- [ ] Loading states shown while fetching
- [ ] Empty states shown when no data
- [ ] Error states shown with error message
- [ ] All text strings in Hebrew
- [ ] No English UI text

#### RTL Support
- [ ] `dir="rtl"` on html element
- [ ] Use `ms-` / `me-` not `ml-` / `mr-`
- [ ] Use `ps-` / `pe-` not `pl-` / `pr-`
- [ ] Use `gap-` not space directional (gap is direction-agnostic)
- [ ] Directional icons flipped in RTL (arrows, chevrons)
- [ ] Text-align checked for RTL (ltr/rtl: variants)
- [ ] No hardcoded `left:` / `right:` positioning (use `start:` / `end:`)

#### Styling
- [ ] Only Tailwind classes (no inline styles)
- [ ] Only design tokens from tokens.css (no hardcoded colors)
- [ ] No hardcoded spacing/sizes (use gap, padding from tokens)
- [ ] Tailwind custom colors use CSS variables
- [ ] Media queries use Tailwind breakpoints (not custom)
- [ ] No magic numbers in styles

#### Forms
- [ ] React Hook Form for all form handling
- [ ] Zod for validation schema
- [ ] Schema shared with backend via packages/types
- [ ] Validation errors shown to user in Hebrew
- [ ] Loading state shown during submit
- [ ] Error toast/notification on failure
- [ ] Success confirmation after submit

#### Accessibility
- [ ] Form labels associated with inputs
- [ ] Buttons have accessible labels
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color not sole indicator (text/icons too)
- [ ] Images have alt text

#### Tests
- [ ] Component snapshot or visual tests
- [ ] User interactions tested (click, input, submit)
- [ ] Loading/empty/error states tested
- [ ] Hebrew text rendering tested
- [ ] RTL layout tested
- [ ] Accessibility tested
- [ ] Coverage >= 70% on new/changed files

### Shared Code (packages/)

#### types/
- [ ] Zod schemas exported for client/server sharing
- [ ] TypeScript interfaces in separate file if needed
- [ ] Hebrew comments on complex types

#### ui/
- [ ] Components use design tokens only
- [ ] Storybook stories updated if component changed
- [ ] Component exported in index.ts

#### utils/
- [ ] No side effects (pure functions)
- [ ] Hebrew text handling tested
- [ ] Edge cases covered in tests
- [ ] Exported in index.ts

## Test Coverage Review

### Coverage Requirements
- [ ] >= 70% line coverage on new/changed files
- [ ] >= 70% branch coverage
- [ ] >= 70% function coverage
- [ ] >= 70% statement coverage
- [ ] All public methods tested
- [ ] Edge cases tested
- [ ] Error cases tested

### What to Test

#### Services
- All CRUD operations (Create, Read, Update, Delete)
- organizationId scoping in all queries
- Soft delete behavior
- Error handling and exceptions
- Hebrew text handling
- Logging behavior

#### Components
- Rendering with required props
- All optional props variations
- Loading state
- Empty state
- Error state
- Success state
- User interactions (click, type, submit)
- RTL rendering
- Hebrew text display

#### Utilities
- Normal cases
- Edge cases (null, undefined, empty)
- Error cases
- Hebrew text handling
- Performance (if applicable)

## Architecture Review

### Monorepo Structure
- [ ] Changes follow existing patterns
- [ ] No circular dependencies
- [ ] Proper separation of concerns
- [ ] Feature modules organized correctly
- [ ] Shared code in packages/ not duplicated

### Database
- [ ] Schema changes in schema.prisma only
- [ ] Migration created with clear name
- [ ] No manual migration edits
- [ ] Indexes added on filtered/joined columns
- [ ] organizationId indexed
- [ ] createdAt indexed for ordering
- [ ] Foreign keys with proper constraints

### API Design
- [ ] RESTful endpoints (GET, POST, PATCH, DELETE)
- [ ] Correct HTTP status codes (200, 201, 204, 400, 401, 403, 404)
- [ ] Consistent response envelope
- [ ] Consistent error responses
- [ ] Pagination implemented where needed (skip, take)
- [ ] Filtering/searching available where needed
- [ ] Sorting available where needed

### Performance
- [ ] N+1 queries avoided (use `select` in findMany if needed)
- [ ] Indexes added on frequently queried fields
- [ ] Large responses paginated
- [ ] No unnecessary data transfers
- [ ] Image/file sizes optimized

## Compliance Review

### Definition of Done
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] All tests pass: `pnpm test`
- [ ] Test coverage >= 70%
- [ ] Swagger docs generated (if API)
- [ ] Components render correctly RTL
- [ ] No hardcoded English UI strings
- [ ] No console.log in production code
- [ ] Soft delete used (no hard deletes)
- [ ] organizationId scoping verified

### Git Hygiene
- [ ] Commit messages are clear and descriptive
- [ ] No merge commits (rebase if needed)
- [ ] Branch name follows convention
- [ ] No leftover TODO/FIXME comments
- [ ] No debugging code left in

## Critical Issues (Block Merge)

Stop the review if you find ANY of these:

1. **Multi-tenancy leak**: Query without organizationId or with user-provided organizationId
2. **Hard delete**: Using prisma.*.delete() anywhere (must soft delete)
3. **Auth bypass**: Protected route without JwtAuthGuard or RolesGuard
4. **Sensitive data exposure**: Logging passwords, tokens, SSNs, account numbers
5. **SQL injection**: String concatenation in DB queries (not using Prisma)
6. **XSS vulnerability**: innerHTML with user input or unescaped HTML
7. **No tests**: New service/component with zero test coverage
8. **Type violations**: Any as parameter type or return type
9. **English UI strings**: User-facing text in English (must be Hebrew)
10. **Hardcoded colors**: UI using hardcoded hex instead of design tokens

## Report Format

Create a review comment with this structure:

```markdown
## Review Summary

**Status**: ✅ Approved / ⚠️ Needs Changes / ❌ Blocked

### Critical Issues
(if any, list here - block merge if present)

### Security Review
- ✅ Multi-tenancy scoping verified
- ✅ No sensitive data exposed
- ✅ All routes protected
- ⚠️ Missing rate limiting on POST /donors
- (etc.)

### Code Quality
- ✅ TypeScript strict mode
- ✅ Test coverage 78%
- ✅ Swagger docs complete
- ⚠️ One unused import in service.ts
- (etc.)

### Architecture
- ✅ Follows module structure
- ✅ Proper separation of concerns
- ⚠️ Consider extracting helper function
- (etc.)

### Suggestions
- Consider adding pagination to findAll()
- Add Hebrew descriptions to DTOs
- Extract repeated validation logic

### Approved To Merge
Once issues resolved, this PR is ready to merge.
```

## Success Criteria

- [ ] No critical issues found
- [ ] All security requirements met
- [ ] All code quality standards met
- [ ] Test coverage >= 70%
- [ ] Swagger/API docs complete
- [ ] Multi-tenancy verified
- [ ] RTL support verified (if UI)
- [ ] Ready for merge
