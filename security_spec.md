# Security Specification & Threat Model (Firestore Security Rules)

## 1. Data Invariants

- **Profiles**:
  - A user’s profile is keyed by their `userId` which must equal their authenticated Firebase UID (`request.auth.uid`).
  - Users can read all profiles, but writing or editing is strictly restricted to the owner of that profile.
- **Statuses (Moments)**:
  - Users must be signed in to view and create statuses.
  - A status can only be created with the user's authentic `personId`, matching `request.auth.uid`.
  - Status updates (like liking or editing) must be validated. A status can only be updated if valid keys are targeted.
  - A user can only delete or edit their own statuses.
- **Comments**:
  - Comments must be attached to a valid status and can only be written by a signed-in user.
- **Chats & Messages**:
  - A user can only read or write to a chat and its subcollection messages if they are one of the designated participants or members.
- **Friend Requests**:
  - A user can only read, update, or cancel friend requests that they sent or received.

---

## 2. The "Dirty Dozen" Payloads (Exploit Payloads)

Here are 12 specific exploit JSON payloads designed to violate system boundaries and must result in `PERMISSION_DENIED`:

1. **Profile Hijacking**: Attempt to create a profile for user `victim_123` while authenticated as `hacker_789`.
   - Result: `PERMISSION_DENIED` (UID mismatch)
2. **Profile Ghost-Field Escalation**: Attempt to update profile with a ghost field `{ "isAdmin": true, "name": "Hacker" }`.
   - Result: `PERMISSION_DENIED` (Key validation failing / hasOnly)
3. **Spoofed Moment Creator**: Attempt to post status with `personId: "victim_123"` while authenticated as `hacker_789`.
   - Result: `PERMISSION_DENIED`
4. **Giant Moment Payload**: Attempt to post status with a text exceeding 20,000 characters.
   - Result: `PERMISSION_DENIED` (Size limit validation)
5. **Direct Message Snooping**: Anonymous/unauthorized user attempting to read messages in `/chats/aisha_ben/messages/msg_1`.
   - Result: `PERMISSION_DENIED`
6. **Chat Room Poisoning**: Hacker trying to insert a message with a senderId of `ben` (the victim) instead of their own userId in `/chats/hacker_ben/messages/msg_2`.
   - Result: `PERMISSION_DENIED` (The validation helper verifies `senderId == request.auth.uid`)
7. **Phantom Status Comment**: Attempt to post a comment as "Administrator" in `/statuses/st_aisha/comments/c_6` from a non-owner/different user.
   - Result: `PERMISSION_DENIED`
8. **Friend Request Spoofing**: Attempt to edit the state of a friend request `/requests/req_rio` to `'accepted'` without being the designated receiver.
   - Result: `PERMISSION_DENIED`
9. **Tampering with Immutable Status Fields**: Attempting to change `createdAt` of a status post after creation.
   - Result: `PERMISSION_DENIED`
10. **Hacking Likes List of Others**: Attempting to completely overwrite/empty the likes list on another user's moment without being the owner or doing a standard toggle.
    - Result: `PERMISSION_DENIED`
11. **Injecting Large Malformed IDs**: Attempting to write a document with a path-variable key of 5,000 bad characters.
    - Result: `PERMISSION_DENIED` (isValidId failure)
12. **Insecure List Scrapes**: Attempt to list all chats using a wildcard query without any participant constraints.
    - Result: `PERMISSION_DENIED` (The list query rule enforces participant checks)

---

## 3. Test Specifications & Rule Assertions

Rules are built defense-in-depth:
- Global Safety Net (`allow read, write: if false`)
- Strict type checking on every field
- Immutable fields protected (`createdAt`, `userId`)
- Temporal integrity synced to `request.time`
- Master gate relational checks applied
