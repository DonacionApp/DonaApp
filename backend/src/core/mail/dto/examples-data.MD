# Ejemplos de Envío de Correos Electrónicos

## 1. Correo de Restablecimiento de Contraseña
```javascript
const testSendEmailResetPassword = {
    to: 'alguien@gmail.com',
    subject: 'Restablece tu contraseña',
    type: 'reset-password',
    context: {
        user: 'Andrés Iles',
        idUser: 101, //no requerido
        code: '654321',
        url: 'https://miapp.com/reset-password/101',
    },
}
await this.mailService.sendMail(testSendEmailResetPassword);

console.log('Correo de restablecimiento de contraseña enviado con éxito');
```

## 2. Correo de Notificación
```javascript
const mailNotification = {
    to: 'alguien@gmail.com',
    subject: 'Tienes una nueva notificación importante',
    type: 'notification',
    context: {
        user: 'Andrés Iles',
        idUser: 101, //no requerido
        message: 'Tu solicitud ha sido aprobada exitosamente. Puedes revisar los detalles en tu panel de usuario.',
    },
};
await this.mailService.sendMail(mailNotification);
console.log('Correo de notificación enviado con éxito');
```

## 3. Correo de Verificación de Cuenta (Identidad)
```javascript
const mailVerifyAccount = {
    to: 'alguien@gmail.com',
    subject: 'confirmacion de tu identidad',
    type: 'confirm-account',
    context: {
        user: 'Andrés Iles',
        idUser: 101, //no requerido
        title: '¡Verificación de identidad de tu cuenta!',
        message: 'Gracias por registrarte en nuestra plataforma. Para completar tu registro y confirmar tu identidad, por favor verifica tu cuenta haciendo clic en el enlace de verificación que hemos enviado.',
    },
};
await this.mailService.sendMail(mailVerifyAccount);
console.log('Correo de confirmación de verificacion de cuenta enviado con éxito');
```

## 4. Correo de Confirmación de Cuenta (Email)
```javascript
const mailConfirmAccount = {
    to: 'alguien@gmail.com',
    subject: 'Verificacion de correo electronico',
    type: 'confirm-account',
    context: {
        user: 'Andrés Iles',
        idUser: 101, //no requerido
        title: '¡Verificación de correo electronico!',
        message: 'Gracias por registrarte en nuestra plataforma. Para completar tu registro y confirmar tu identidad, por favor verifica tu cuenta haciendo clic en el enlace de verificación que hemos enviado.',
    },
};
await this.mailService.sendMail(mailConfirmAccount);
console.log('Correo de confirmación de cuenta enviado con éxito');
```

## 5. Correo de Actualización de Donación
```javascript
const mailDonationUpdate: MailDto = {
    to: 'alguien@gmail.com',
    subject: 'Actualización de tu donación',
    type: 'donation-update',
    context: {
        user: 'Andrés Iles',
        idUser: 101, //no requerido
        status: 'En camino', // puede ser: 'Pendiente', 'En proceso', 'En camino', 'Completada'
        message: 'Tu donación #DN-204 está actualmente en camino al centro de distribución. ¡Gracias por tu generosidad y compromiso!',
    },
};

await this.mailService.sendMail(mailDonationUpdate);
console.log('Correo de actualización de donación enviado con éxito');
```

## Tipos de Correo Disponibles

- `reset-password`: Restablecimiento de contraseña
- `notification`: Notificaciones generales
- `confirm-account`: Confirmación/verificación de cuenta
- `donation-update`: Actualización de estado de donación

## Estados de Donación

- Pendiente
- En proceso
- En camino
- Completada