# Contributing

## Development Principles

Contributions should follow these rules:

- keep code modular and reusable
- avoid business logic in route files
- preserve existing working behavior
- prefer scalable patterns over quick fixes
- document architectural decisions where relevant

## Recommended Workflow

1. Create or update documentation if the feature changes architecture or workflow.
2. Add or update backend validation and authorization where needed.
3. Keep API contracts consistent.
4. Verify frontend responsiveness and theme compatibility.
5. Test locally before opening a pull request.

## Code Structure Expectations

### Frontend

- `components`
- `pages`
- `layouts`
- `hooks`
- `context`
- `services`
- `api`
- `utils`
- `assets`

### Backend

- `routes`
- `controllers`
- `services`
- `repositories`
- `middleware`
- `validators`
- `config`
- `utils`
- `scripts`

## Pull Request Notes

Include:

- what changed
- why it changed
- any database changes
- any environment variable changes
- screenshots for UI changes when applicable
