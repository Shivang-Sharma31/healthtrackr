import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "cerberus",
        product: {
            name: "Task Manager",
            link: "https://taskmanagelink.com",
        },
    });

    const emailTextual = mailGenerator.generatePlaintext(
        options.mailgenContent
    );

    const emailHtml = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        (console.error(
            "Email service failed silently.Make sure that you have provided your MAILTRAP crendentials in the .env file"
        ),
            console.error("Error: ", error));
    }
};

const emailVerificationMaingenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! we are excited to have you on board.",
            action: {
                instructions:
                    "To verify your email please click on the following button",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your email",
                    link: verificationUrl,                   
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const healthAnomalyAlertContent = (username, dashboardUrl) => {
    return {
        body: {
            name: username,
            intro: [
                "⚠️ Alert: Unusual health metrics detected.",
                "Our automated health monitoring system has identified some anomalies in your tracked metrics over the past 24 hours that deviate from your normal baseline.",
            ],
            action: {
                instructions:
                    "Please log into your account to review your logs.",
                button: {
                    color: "#D9534F",
                    text: "Review Health Dashboard",
                    link: dashboardUrl,
                },
            },
            outro: [
                "🔬 Medical Disclaimer: This is an automated notification based on a machine learning model and does not substitute for professional medical advice. If you are feeling genuinely unwell, experiencing symptoms, or having a medical emergency, please consult a healthcare professional or contact emergency services immediately.",
                "Take care of yourself!",
            ],
        },
    };
};

export {
    emailVerificationMaingenContent,
    sendEmail,
    healthAnomalyAlertContent,
};
