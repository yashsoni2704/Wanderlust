const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.BREVO_SMTP_USER, // Your Gmail address
            pass: process.env.BREVO_SMTP_PASS  // Your App Password: ykrc jizm eqcy evzb
        }
    });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, username) => {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:9000'}/reset-password/${resetToken}`;
    
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Wanderlust</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background-color: #2c5aa0;
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 5px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 400;
            }
            
            .content {
                padding: 30px 25px;
                background-color: #ffffff;
            }
            
            .greeting {
                font-size: 16px;
                margin-bottom: 15px;
                color: #333333;
                font-weight: 400;
            }
            
            .message {
                font-size: 14px;
                margin-bottom: 20px;
                color: #333333;
                line-height: 1.6;
            }
            
            .reset-button {
                display: inline-block;
                background-color: #2fb8ac;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                margin: 15px 0;
                transition: background-color 0.3s ease;
            }
            
            .reset-button:hover {
                background-color: #26a69a;
            }
            
            .warning {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #6c757d;
            }
            
            .warning h3 {
                color: #495057;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .footer {
                background-color: #ffffff;
                padding: 20px 25px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #6c757d;
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            .footer a {
                color: #2fb8ac;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            .expiry {
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 12px;
                margin: 15px 0;
                color: #1565c0;
                font-size: 13px;
            }
            
            .url-box {
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #6c757d;
                border: 1px solid #e9ecef;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                }
                
                .content {
                    padding: 20px 15px;
                }
                
                .header {
                    padding: 20px 15px;
                }
                
                .header h1 {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Wanderlust</h1>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${username || 'Adventurer'},
                </div>
                
                <div class="message">
                    We received a request to reset your password for your Wanderlust account. If you made this request, click the button below to reset your password:
                </div>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <div class="expiry">
                    <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </div>
                
                <div class="warning">
                    <h3>Security Notice</h3>
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged, and no further action is required.</p>
                </div>
                
                <div class="message">
                    If the button above doesn't work, you can copy and paste the following link into your browser:
                </div>
                
                <div class="url-box">
                    ${resetUrl}
                </div>
            </div>
            
            <div class="footer">
                <p>This email was sent from Wanderlust - Your Travel Companion</p>
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; 2024 Wanderlust. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const mailOptions = {
        from: '"Wanderlust Team" <noreply@wanderlust.com>',
        to: email,
        subject: '🔐 Reset Your Wanderlust Password',
        html: htmlTemplate,
        text: `Hello ${username || 'Adventurer'}! We received a request to reset your password for your Wanderlust account. If you made this request, please click the following link to reset your password: ${resetUrl}. This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.`
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail
};

// Send numeric OTP email for password reset verification
async function sendPasswordResetOtpEmail(email, otp, username) {
    const transporter = createTransporter();

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP - Wanderlust</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background-color: #2c5aa0;
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 5px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 400;
            }
            
            .content {
                padding: 30px 25px;
                background-color: #ffffff;
            }
            
            .greeting {
                font-size: 16px;
                margin-bottom: 15px;
                color: #333333;
                font-weight: 400;
            }
            
            .message {
                font-size: 14px;
                margin-bottom: 20px;
                color: #333333;
                line-height: 1.6;
            }
            
            .otp-container {
                text-align: center;
                margin: 25px 0;
            }
            
            .otp-code {
                display: inline-block;
                background-color: #ffffff;
                color: #333333;
                font-weight: 700;
                font-size: 28px;
                letter-spacing: 4px;
                border: 2px dashed #cccccc;
                border-radius: 8px;
                padding: 20px 30px;
                margin: 10px 0;
            }
            
            .note {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #6c757d;
                font-size: 13px;
            }
            
            .footer {
                background-color: #ffffff;
                padding: 20px 25px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #6c757d;
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                }
                
                .content {
                    padding: 20px 15px;
                }
                
                .header {
                    padding: 20px 15px;
                }
                
                .header h1 {
                    font-size: 20px;
                }
                
                .otp-code {
                    font-size: 24px;
                    letter-spacing: 3px;
                    padding: 16px 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Wanderlust</h1>
                <p>Password Reset OTP</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${username || 'Traveler'},
                </div>
                
                <div class="message">
                    We received a request to reset your password. Please use the following OTP to verify your identity:
                </div>
                
                <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="note">
                    <strong>Note:</strong> This OTP is valid for a limited time. Do not share it with anyone.
                </div>
                
                <div class="message">
                    If you did not request a password reset, please ignore this email.
                </div>
            </div>
            
            <div class="footer">
                <p>- Team Wanderlust</p>
                <p>&copy; ${new Date().getFullYear()} Wanderlust. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const mailOptions = {
        from: 'Wanderlust <noreply@wanderlust.com>',
        to: email,
        subject: 'Your Wanderlust password reset OTP',
        html,
        text: `Hello ${username || 'Traveler'}, your password reset OTP is ${otp}. It expires in 10 minutes.`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return { success: false, error: error.message };
    }
}

module.exports.sendPasswordResetOtpEmail = sendPasswordResetOtpEmail;
