import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'JariyahSoft' : 'จริยะซอฟต์';
  const subtitle = isEn
    ? 'Digital Software & Knowledge Platform'
    : 'แพลตฟอร์มศูนย์กลางซอฟต์แวร์ไทย';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #07111f 0%, #0f172a 42%, #0b2a3d 74%, #062f2b 100%)',
          color: '#f8fafc',
          position: 'relative',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.35), transparent 26%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.22), transparent 22%), radial-gradient(circle at 50% 80%, rgba(245,158,11,0.18), transparent 20%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px',
            width: '100%',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 900,
                }}
              >
                จ
              </div>
              <div>
                <div style={{ fontSize: '68px', fontWeight: 900, lineHeight: 1 }}>{title}</div>
                <div style={{ marginTop: '12px', fontSize: '30px', color: 'rgba(226,232,240,0.88)' }}>{subtitle}</div>
              </div>
            </div>
            <div
              style={{
                padding: '18px 24px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              {isEn ? 'Trusted by Thai developers' : 'เชื่อถือได้จากนักพัฒนาไทย'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              isEn ? 'Software' : 'ซอฟต์แวร์',
              isEn ? 'Knowledge' : 'ความรู้',
              isEn ? 'Moderation' : 'การตรวจสอบ',
            ].map((label) => (
              <div
                key={label}
                style={{
                  padding: '16px 22px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: '24px',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
