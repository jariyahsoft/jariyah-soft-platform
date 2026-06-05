# Project Overview

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 1, 2, 4, 19, 20

## ชื่อโครงการ

**Jariyah Soft Platform**
แพลตฟอร์มศูนย์กลางซอฟต์แวร์ องค์ความรู้ดิจิทัล การเรียนรู้ กิจกรรม งาน และชุมชนนักพัฒนาซอฟต์แวร์สำหรับประชาชน

## วัตถุประสงค์

1. เผยแพร่ซอฟต์แวร์ที่พัฒนาโดยคนไทยให้ประชาชนเข้าถึงได้
2. ส่งเสริมการใช้เทคโนโลยีดิจิทัลอย่างถูกต้องและปลอดภัย
3. เผยแพร่ความรู้ด้าน AI เทคโนโลยีสารสนเทศ และ Open Source
4. สร้างพื้นที่ให้นักพัฒนาเผยแพร่ผลงานและสร้างชุมชน
5. สนับสนุนโครงการ Open Source การเรียนรู้ กิจกรรม และการจับคู่งาน
6. มีระบบกำกับดูแลเนื้อหา ความปลอดภัย PDPA และ Audit Trail

## โมดูลในขอบเขต

* Software Hub
* Knowledge Hub
* Developer Portal
* Learning System
* Event Management
* Open Source Incubator
* Job & Collaboration Board
* Notification Center
* Search
* Analytics Dashboard
* Public API
* Administration and Moderation

## นอกขอบเขต MVP

* การรับชำระเงินเต็มรูปแบบ
* Mobile application แบบ native
* AI recommendation แบบ personalization
* Government Single Sign-On

## กลุ่มผู้ใช้งานและสิทธิ์

| Role | สิทธิ์หลัก |
|---|---|
| Guest | ดูและค้นหาเนื้อหาที่เผยแพร่ ดาวน์โหลดซอฟต์แวร์ สมัครสมาชิก |
| Member | สิทธิ์ Guest รวมถึงรีวิว ให้คะแนน แสดงความคิดเห็น ติดตาม สมัครกิจกรรมและหลักสูตร |
| Developer | สิทธิ์ Member รวมถึงสร้างโปรไฟล์ ส่งซอฟต์แวร์ บทความ โครงการ และประกาศงาน |
| Moderator | ตรวจสอบ อนุมัติ ปฏิเสธ ซ่อนเนื้อหา และจัดการรายงานตามขอบเขตที่ได้รับ |
| Administrator | จัดการผู้ใช้ Role สิทธิ์ หมวดหมู่ Badge การตั้งค่าระบบ และ Audit Log |

### หลัก Least Privilege

* Role ถูกเก็บใน Firebase Auth custom claims และสำเนาใน `users.role`
* Security Rules ใช้ custom claims เป็นแหล่งตัดสินสิทธิ์
* Client ห้ามแก้ `role`, `status`, `reputationScore` และข้อมูลอนุมัติโดยตรง
* การเปลี่ยน Role ต้องทำผ่าน Admin API และบันทึก Audit Log

## Functional Modules Summary

### Software Hub
- แสดงรายการ ค้นหา กรอง ดาวน์โหลด รีวิว ซอฟต์แวร์
- สถานะ: `draft` → `submitted` → `under_review` → `approved` → `published` → `archived`

### Knowledge Hub
- บทความ วิดีโอ PDF Infographic Tutorial
- หมวด: AI, Windows, Linux, Android, iOS, Programming, IoT, Cybersecurity, Open Source, Productivity

### Developer Portal
- โปรไฟล์ ผลงาน สถิติ GitHub integration

### Learning System
- Learning Path, Quiz (Multiple Choice + Practical), Certificate

### Event Management
- Webinar, Workshop, Meetup, Hackathon, Competition
- Capacity management + Waitlist

### Open Source Incubator
- Stage: idea → prototype → beta → stable → mature
- Mentor / Contributor / Project Owner

### Job & Collaboration Board
- Full Time, Part Time, Freelance, Internship + Contributor matching

### Badge, Reputation & Ranking
- ระดับ: Bronze → Silver → Gold → Platinum → Elite
- Ranking: Downloads 40%, Ratings 25%, Maintenance 15%, Active Users 10%, Documentation 10%

## Roadmap

### Phase 1: MVP (เดือน 1-3)
* Landing, Member/Auth, Software Hub, Knowledge Hub
* Developer profile และ submission draft
* Firestore schema, Security Rules, Storage Rules
* Typesense basic search
* Moderation workflow และ Audit Log

### Phase 2: Community Growth (เดือน 4-6)
* Reviews, follows, notifications, reports
* Reputation, badges, ranking และ analytics
* Search synonym/Thai tuning

### Phase 3: Learning and Events (เดือน 7-9)
* Learning paths, quizzes, progress, certificates
* Events, capacity, waitlist และ reminders

### Phase 4: Open Source Ecosystem (เดือน 10-12)
* Incubator, mentor, contributor matching
* Job board และ software certification
* Public API beta

### Phase 5: National Scale (ปีที่ 2 เป็นต้นไป)
* Mobile application, additional languages
* Recommendation engine และ AI assistant
* Government/Education integration
* Open Data Platform

## Monetization

Funding: Donation, Sponsorship, Government Support, Foundation Grant

Policy: ซอฟต์แวร์สำหรับประชาชนยังคงใช้งานฟรี
