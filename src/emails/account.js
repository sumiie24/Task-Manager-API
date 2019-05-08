const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) =>{
    sgMail.send({
        to: email,
        from:'adminsumit@gmail.com',
        subject: 'This is my first creation!',
        text: ` Welcome to the app, ${name}. Let me know how are you! `
    })
}

const sendCancelEmail = (email,name) =>{
    sgMail.send({
        to: email,
        from:'adminsumit@gmail.com',
        subject: 'Account Deleted!',
        text: `Good Bye, ${name}. Is there anything we could have done to have kept you on board or something like that!`
    })
}


module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}