# Security Specification for Educational App

## Data Invariants
- Users can only read/write their own profile.
- Only admins can modify roles.
- `role` must be 'user' on creation.

## The "Dirty Dozen" Payloads
1. Create user with `role: 'admin'`.
2. Update another user's profile.
3. Update own `role` to 'admin'.
4. Delete user profile.
5. Write to non-existent collection.
6. Write string length > 128 to userId.
7. Write invalid email format.
8. Inject ghost field 'verified: true'.
9. Read other user's profile.
10. Update whitelisted field with invalid type.
11. Attempt array modification in non-existent array.
12. Update `createdAt` field post-creation.

## Test Runner
(To be implemented in firestore.rules.test.ts)
