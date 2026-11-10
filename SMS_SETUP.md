# SMS Authentication Setup Guide

Phone sign-up and sign-in uses Supabase's SMS OTP verification. To enable this feature, you need to configure an SMS provider in your Supabase project.

## Step 1: Choose an SMS Provider

Supabase supports the following SMS providers:
- **Twilio** (Recommended)
- **Twilio Verify**
- **MessageBird**
- **Vonage**
- **Telesign**
- **AWS SNS**
- **SNS**
- **Custom SMS Provider**

## Step 2: Configure SMS Provider in Supabase

### Using Twilio (Recommended)

1. **Create a Twilio Account**
   - Go to https://www.twilio.com
   - Sign up for a free trial account
   - You'll get a phone number and API credentials

2. **Get Twilio Credentials**
   - Account SID: Available in Twilio Console
   - Auth Token: Available in Twilio Console
   - Phone Number: The Twilio phone number you'll use to send SMS

3. **Configure in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Click on **Phone**
   - Enable the Phone provider
   - Select **Twilio** as the SMS provider
   - Enter your Twilio credentials:
     - Account SID
     - Auth Token
     - From Phone Number (your Twilio number)
   - Click **Save**

### Using Other Providers

Follow similar steps for other providers:
1. Create an account with the provider
2. Get API credentials
3. Configure in Supabase Dashboard under Authentication → Providers → Phone

## Step 3: Enable Phone Auth in Your Project

Phone authentication is already implemented in the code. Once you configure the SMS provider in Supabase, it will work automatically.

The implementation includes:
- Phone number validation (international format: +1234567890)
- OTP sending with rate limiting (3 attempts per 5 minutes)
- OTP verification (6-digit code)
- Security features (input sanitization, rate limiting)

## Step 4: Test Phone Authentication

1. Go to the auth page
2. Click on "Phone" tab
3. Enter your phone number in international format (e.g., +1234567890)
4. Click "Send OTP"
5. You should receive a 6-digit code via SMS
6. Enter the code to verify

## Troubleshooting

**"SMS not configured" error**
- Make sure you've configured an SMS provider in Supabase Dashboard
- Check that your provider credentials are correct
- Verify your provider account has sufficient credits

**OTP not received**
- Check the phone number format (must include country code: +1234567890)
- Verify your SMS provider has credits
- Check if the number is blocked by your provider
- Try with a different phone number

**Rate limiting errors**
- Wait for the specified time before trying again
- The rate limit is 3 OTP requests per 5 minutes

## Cost Considerations

- Twilio free trial includes some free SMS
- After trial, SMS costs vary by country (typically $0.05-$0.10 per SMS)
- Consider implementing SMS costs monitoring in production

## Security Notes

- Phone authentication is secure as it uses one-time passwords
- Rate limiting prevents abuse
- OTP codes expire after a short time
- Never share OTP codes with others
