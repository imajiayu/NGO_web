# Email Configuration Guide

This guide explains how to set up email notifications for donation confirmations.

## Email Service: Resend

We use [Resend](https://resend.com) for sending transactional emails. Resend is a modern email API built for developers with excellent deliverability.

### Why Resend?

- ✅ Simple API and great documentation
- ✅ Generous free tier (3,000 emails/month for free)
- ✅ Excellent deliverability rates
- ✅ Built-in email templates support
- ✅ Easy integration with Next.js
- ✅ Real-time analytics and logs

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Navigate to the [API Keys](https://resend.com/api-keys) page
2. Click "Create API Key"
3. Give it a name (e.g., "NGO Platform Production")
4. Select the appropriate permissions:
   - ✅ Sending access
   - ❌ Full access (not needed)
5. Copy the API key (starts with `re_`)
6. **Important**: Save it securely - you won't be able to see it again!

### 3. Configure Your Domain (Optional but Recommended)

For production use, you should verify your domain to send emails from your own domain (e.g., `noreply@yourorg.com`).

#### Using Resend's Domain (Development)

For development and testing, you can use Resend's default sending domain:
- From email: `onboarding@resend.dev`
- No domain verification needed
- Limited to 100 emails/day

#### Using Your Own Domain (Production)

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain name: `waytofutureua.org.ua`
4. Add the DNS records shown to your domain's DNS settings:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT) - optional but recommended

5. Wait for DNS propagation (usually 5-30 minutes)
6. Verify the domain in Resend dashboard
7. Once verified, you can send from any email address at your domain

**Recommended sender addresses for waytofutureua.org.ua:**
- `noreply@waytofutureua.org.ua` - For automated emails (recommended)
- `donations@waytofutureua.org.ua` - For donation confirmations
- `support@waytofutureua.org.ua` - For support emails
- `info@waytofutureua.org.ua` - For general inquiries

### 4. Set Environment Variables

Add the following to your `.env.local` file:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_actual_api_key_here

# From email address (use your verified domain or onboarding@resend.dev for testing)
RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
```

**For development:**
```bash
RESEND_API_KEY=re_your_test_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**For production:**
```bash
RESEND_API_KEY=re_your_production_api_key
RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
```

### 5. Update Vercel Environment Variables

If deploying to Vercel:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `RESEND_API_KEY` = `re_your_production_key`
   - `RESEND_FROM_EMAIL` = `noreply@waytofutureua.org.ua`
4. Make sure to set them for the correct environment (Production, Preview, Development)

## Email Templates

We support **three languages** for donation confirmation emails:

### English (en)
- Subject: "Thank You for Your Donation - {Project Name}"
- Clean, professional design
- Includes all donation IDs and next steps

### Chinese (zh)
- Subject: "感谢您的捐赠 - {项目名称}"
- Localized content and formatting
- Cultural appropriateness

### Ukrainian (ua)
- Subject: "Дякуємо за ваше пожертвування - {Назва проекту}"
- Localized content
- Proper Ukrainian grammar

The correct template is automatically selected based on the `locale` stored with the donation.

## Email Content

Each donation confirmation email includes:

1. **Personalized Greeting**
   - Uses donor's name from the donation form

2. **Donation Details**
   - Project name
   - Total amount donated
   - Currency

3. **Donation IDs**
   - List of all donation IDs from this payment
   - Formatted as `{project_id}-{XXXXXX}` (e.g., `1-A1B2C3`)
   - Easy to copy and save

4. **Important Notice**
   - Instructions to save the IDs for tracking
   - Explanation of how to use them

5. **Next Steps**
   - What happens after payment
   - Donation confirmation and delivery process

6. **Contact Information**
   - Encouragement to reach out with questions

## Testing

### Test with Resend CLI (Optional)

```bash
# Install Resend CLI
npm install -g resend-cli

# Send a test email
resend emails send \
  --from "onboarding@resend.dev" \
  --to "your-email@example.com" \
  --subject "Test Email" \
  --text "This is a test"
```

### Test with Your Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Make a test donation with Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Use your real email to receive the confirmation

3. Check your inbox for the confirmation email

4. Verify the email contains:
   - ✅ Correct language based on selected locale
   - ✅ Correct project name
   - ✅ Correct amount
   - ✅ All donation IDs listed
   - ✅ Proper formatting and styling

### Check Email Logs

1. Go to [Resend Dashboard](https://resend.com/emails)
2. View all sent emails and their status
3. Check for:
   - Delivered
   - Opened (if tracking is enabled)
   - Failed (with error details)

## Troubleshooting

### Email not sending

**Symptoms:**
- No error but email doesn't arrive
- Webhook succeeds but no email sent

**Solutions:**
1. Check RESEND_API_KEY is set correctly
2. Verify API key has sending permissions
3. Check Resend dashboard for failed emails
4. Look for errors in application logs

### Email goes to spam

**Solutions:**
1. Verify your domain with Resend
2. Add SPF, DKIM, and DMARC records
3. Use a professional "from" address
4. Avoid spam trigger words in content
5. Start with low volume and ramp up gradually

### Wrong language in email

**Solutions:**
1. Check `locale` is being saved correctly in donation record
2. Verify locale is one of: `en`, `zh`, `ua`
3. Check the locale is passed from payment form to Stripe metadata
4. Default locale is `en` if locale is invalid

### Domain verification failing

**Solutions:**
1. Double-check DNS records are exact matches
2. Wait 30-60 minutes for DNS propagation
3. Use DNS checker tools to verify records
4. Contact Resend support if issues persist

### API Rate Limits

Free tier limits:
- 3,000 emails/month
- 100 emails/day (with Resend domain)
- Unlimited emails/day (with verified domain)

Upgrade to paid plan if you need more:
- Pro: $20/month for 50,000 emails
- Business: Custom pricing for higher volumes

## Security Best Practices

### 1. Protect Your API Key

- ❌ Never commit API key to Git
- ❌ Never expose in client-side code
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/prod

### 2. Validate Email Addresses

- Emails are validated by Zod schema before sending
- Invalid emails will fail gracefully
- Check logs for validation errors

### 3. Handle Email Failures Gracefully

- Email errors don't fail the webhook
- Donation is recorded even if email fails
- Email failures are logged for monitoring
- Users can check donation status without email

### 4. Monitor Email Activity

- Set up alerts for high failure rates
- Review bounce and complaint rates
- Keep unsubscribe list updated (if applicable)

## Email Analytics

Track email performance in Resend dashboard:

### Metrics Available:
- **Delivered**: Successfully delivered to recipient's server
- **Opened**: Recipient opened the email (requires tracking)
- **Clicked**: Recipient clicked links (if any)
- **Bounced**: Email could not be delivered
- **Complained**: Recipient marked as spam

### Best Practices:
- Monitor delivery rate (should be >95%)
- Keep bounce rate low (<5%)
- Address complaints immediately
- Review failed emails weekly

## Future Enhancements

Potential email features to add:

- [ ] Donation status update emails (when status changes)
- [ ] Receipt PDF attachment
- [ ] Donation anniversary reminders
- [ ] Project completion notifications
- [ ] Monthly donation summaries
- [ ] Tax receipt generation
- [ ] Referral/sharing invitations
- [ ] Newsletter integration

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Status**: https://status.resend.com
- **Resend Support**: support@resend.com
- **Community**: Resend Discord server

---

**Last Updated**: 2024-12-19
**Resend Package Version**: Latest stable
