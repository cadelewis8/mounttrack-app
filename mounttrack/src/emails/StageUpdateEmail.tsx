import { Html, Head, Body, Container, Section, Img, Text, Button, Hr } from '@react-email/components'

interface StageUpdateEmailProps {
  shopName: string
  shopLogoUrl: string | null
  brandColor: string
  customerName: string
  stageName: string
  portalUrl: string
}

export function StageUpdateEmail({
  shopName,
  shopLogoUrl,
  brandColor,
  customerName,
  stageName,
  portalUrl,
}: StageUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '32px auto' }}>
          <Section style={{ backgroundColor: brandColor, padding: '24px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
            {shopLogoUrl ? (
              <Img src={shopLogoUrl} alt={shopName} height="60" style={{ margin: '0 auto', display: 'block' }} />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{shopName}</Text>
            )}
          </Section>
          <Section style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginTop: 0 }}>
              Great news, {customerName}!
            </Text>
            <Text style={{ fontSize: '16px', color: '#444', lineHeight: '1.5' }}>
              Your mount has moved to <strong>{stageName}</strong>. We&apos;re making great progress!
            </Text>
            <Button
              href={portalUrl}
              style={{
                backgroundColor: brandColor,
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '15px',
                fontWeight: 'bold',
                marginTop: '8px',
              }}
            >
              Track Your Progress
            </Button>
          </Section>
          <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0 8px' }} />
          <Text style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
            {shopName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
