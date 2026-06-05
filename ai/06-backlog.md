# Product Backlog

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Section 11

## เกณฑ์ร่วมทุก Story

* API mutation ต้องยืนยันตัวตน ตรวจ Role validate input และบันทึก `requestId`
* หน้า interactive ต้องแสดง loading, empty, validation, network และ permission state
* p95 API response ≤ 500 ms; หน้า public LCP ≤ 2.5 s
* `Idempotency-Key` ต้องไม่สร้างข้อมูลซ้ำ
* เหตุการณ์ที่มีผลต่อสิทธิ์/สถานะต้องมี Audit Log

---

## Guest

### US-001 ดูและค้นหาซอฟต์แวร์
* แสดงเฉพาะ `published` ไม่ถูกลบ/ระงับ
* ค้นหาชื่อ คำอธิบาย Tag ผู้พัฒนา ไทย/อังกฤษ
* กรอง category, platform, license, rating; sort relevance/popularity/recency
* URL เก็บ query/filter เพื่อแชร์/ย้อนกลับ
* search service ล่ม → Firestore fallback
* ผลค้นหา p95 ≤ 500 ms

### US-002 ดาวน์โหลดซอฟต์แวร์
* ไม่ต้อง Login
* Server ตรวจ published + URL ใน allowlist
* บันทึก download ไม่เก็บ IP ตรง, ไม่ count ซ้ำจาก retry
* Broken link → แสดงทางเลือก + health-check event
* Redirect `302` หลัง event queued

### US-003 สมัครสมาชิก
* Email / OAuth provider
* Email signup ต้อง verify ก่อนสร้างเนื้อหา
* ยอมรับ Terms + Privacy Notice เวอร์ชันปัจจุบัน
* Email ซ้ำ → ข้อความทั่วไป ไม่เปิดเผยบัญชี
* Auth provider ล้มเหลว → retry ไม่สร้าง user ซ้ำ

---

## Member

### US-011 ให้คะแนนและรีวิว
* Integer 1-5 + ข้อความตามความยาว
* 1 รีวิว/user/software, แก้ไขได้
* รีวิวใหม่ = `pending`; aggregate เปลี่ยนเมื่อ approved
* ห้ามรีวิว software ตนเอง
* Submit ซ้ำไม่สร้างรีวิวเพิ่ม

### US-012 ติดตาม Software/Developer
* Follow/unfollow idempotent
* เลือกรับ notification แยก channel
* เจ้าของเห็น count ไม่เห็น private data ของ follower

### US-013 แสดงความคิดเห็นและรายงาน
* Comment sanitize + rate limit
* แก้ comment ภายใน policy
* Report: เลือก reason, ห้ามซ้ำ target เดิมใน 24 ชม.
* Moderator ได้ queue ไม่เปิดเผย reporter

### US-014 จัดการโปรไฟล์และความเป็นส่วนตัว
* อัปเดต Display Name, photoURL, locale, Notification Preferences
* จำกัดเฉพาะ UID ตนเอง
* ส่งคำขอ Data Export / Data Deletion (PDPA)
* ลบบัญชี → Anonymize ไม่ลบ Audit Log

---

## Developer

### US-101 ส่งซอฟต์แวร์เข้าระบบ
* Save draft ได้แม้ข้อมูลไม่ครบ
* Submit เมื่อมี: ชื่อ, คำอธิบาย, category, license, platform, download/repo link
* Logo ≤ 5 MB; screenshot ≤ 10 MB/ไฟล์; ตรวจ MIME จริง
* Submit → transaction + แจ้ง Moderator
* ETag ไม่ตรง → `412`
* GitHub ล่ม → บันทึก draft ได้

### US-102 ส่งบทความ
* Preview sanitized Markdown
* Slug unique, แก้ collision ชัดเจน
* External embed เฉพาะ allowlist
* แก้ published article → revision ไม่เขียนทับ
* Reject → แสดงเหตุผล, แก้ส่งใหม่ได้

### US-103 จัดการ Developer Profile
* แก้ bio, skills, public links
* URL ต้อง HTTPS, Social allowlist
* reputation/badges/statistics แก้จาก client ไม่ได้
* เปลี่ยน slug → redirect จาก slug เดิม

---

## Moderator

### US-201 อนุมัติ/ปฏิเสธ Software
* Queue กรองประเภท วันที่ risk flag assignee
* เห็น submission + previous revision + automated checks
* Approve/Reject → transaction, กัน double decision
* Reject ต้องมี reason code + note
* ห้ามอนุมัติผลงานตนเอง
* สร้าง Audit Log + Notification ทุก decision

### US-202 จัดการ Report
* Claim report ป้องกันทำซ้ำ
* Actions: dismiss, request changes, hide, suspend, escalate
* Suspend ฉุกเฉิน → ผล public read/search ภายใน 60 วินาที
* ทุก action มีเหตุผล + ประวัติย้อนหลัง

---

## Administrator

### US-301 จัดการสมาชิก
* ค้นหา UID, email exact, display name
* Suspend → เหตุผล, ระยะเวลา, revoke refresh token
* ห้ามระงับตนเอง/ถอด Admin คนสุดท้าย
* Reactivate → คืนสิทธิ์เดิมตาม policy

### US-302 จัดการ Role
* เปลี่ยน Role ผ่าน privileged backend เท่านั้น
* อัปเดต Auth custom claims + Firestore แบบ retryable
* ล้มเหลว → mark reconciliation pending
* Role ใหม่มีผล ≤ 5 นาที / หลัง token refresh

### US-303 จัดการ Master Data
* เพิ่ม/แก้/ปิด category, tag, badge, license, learning path
* ห้ามลบ master data ที่ถูกอ้างอิง → `isActive=false`
* Slug/code unique, update settings ใช้ optimistic concurrency

---

## Knowledge Hub

### US-401 อ่านและค้นหาความรู้
* ค้นหา title, body, tag, category, author
* Filter language/content type, sort relevance/recency
* Estimated reading time + accessible media metadata
* Unpublished → ไม่อยู่ใน sitemap, API, search

---

## Learning System

### US-501 เรียนและทำแบบทดสอบ
* Progress ต่อ user/path, resume ข้ามอุปกรณ์
* Prerequisite ต้องผ่านก่อน
* ตรวจคำตอบ server-side, ไม่ส่ง answer key ก่อน submit
* Attempt เกิน limit → `422`
* Certificate ออกครั้งเดียวเมื่อผ่านครบ

---

## Event Management

### US-601 สมัครกิจกรรม
* Active, ก่อน deadline, มีที่ว่าง
* Transaction: `registrationCount` ≤ `capacity`
* เต็ม → waitlist ตามลำดับ
* ยกเลิก → เลื่อน waitlist + notification
* Request ซ้ำ → ไม่สร้าง registration ซ้ำ

---

## Job Board & Incubator

### US-701 ประกาศงาน
* กรอกประเภท งาน สถานที่/remote ทักษะ URL วันหมดอายุ
* URL ผ่าน safe-browsing/allowlist
* หมดอายุ → ออกจากผลค้นหาอัตโนมัติ

### US-702 หาโครงการ Open Source
* กรอง stage + skill need
* สมัคร Contributor พร้อมข้อความ/ทักษะ
* Owner รับ/ปฏิเสธ ไม่เพิ่มซ้ำ
* Project suspended → ปิดรับสมัคร + ออกจาก search ≤ 60 วินาที
