// Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "fotocredencial-30d54.firebaseapp.com",
  databaseURL: "https://fotocredencial-30d54-default-rtdb.firebaseio.com",
  projectId: "fotocredencial-30d54",
  storageBucket: "fotocredencial-30d54.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Elementos del DOM
const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('loginBtn');
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Clave secreta para cifrado
const secretKey = "clave-secreta-fotocredencial-2023";

// Usuarios permitidos (en mayúsculas)
const USUARIOS_PERMITIDOS = ['NICKO', 'DOKO', 'DANIEL', 'JULIO'];

// Estado de la aplicación
let currentUser = null;

// Función para verificar usuario
function verificarUsuario(username) {
    return USUARIOS_PERMITIDOS.includes(username.toUpperCase());
}

// Función para cifrar mensajes
function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
}

// Función para descifrar mensajes
function decryptMessage(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Función para mostrar mensajes en el chat
function displayMessage(sender, message, isCurrentUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
    
    const infoElement = document.createElement('div');
    infoElement.classList.add('message-info');
    infoElement.textContent = sender + ' - ' + new Date().toLocaleTimeString();
    
    const textElement = document.createElement('div');
    textElement.textContent = message;
    
    messageElement.appendChild(infoElement);
    messageElement.appendChild(textElement);
    chatArea.appendChild(messageElement);
    
    // Scroll automático al último mensaje
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Validación en tiempo real del nombre de usuario
usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim().toUpperCase();
    if (username && !verificarUsuario(username)) {
        usernameInput.classList.add('error');
    } else {
        usernameInput.classList.remove('error');
    }
});

// Iniciar sesión anónima
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim().toUpperCase();
    
    if (!username) {
        alert("Por favor ingresa un nombre de usuario");
        return;
    }
    
    if (!verificarUsuario(username)) {
        alert("Usuario no válido. Solo se permiten: NICKO, DOKO, DANIEL, JULIO");
        return;
    }
    
    auth.signInAnonymously()
        .then(() => {
            currentUser = {
                id: Date.now().toString(),
                name: username
            };
            
            usernameInput.disabled = true;
            loginBtn.disabled = true;
            messageInput.disabled = false;
            sendBtn.disabled = false;
            
            // Escuchar mensajes existentes
            database.ref('messages').on('child_added', (snapshot) => {
                const messageData = snapshot.val();
                // Verificar que el remitente sea válido
                if (USUARIOS_PERMITIDOS.includes(messageData.senderName)) {
                    const decryptedMessage = decryptMessage(messageData.text);
                    const isCurrentUser = messageData.senderId === currentUser.id;
                    
                    displayMessage(
                        isCurrentUser ? 'Tú' : messageData.senderName,
                        decryptedMessage,
                        isCurrentUser
                    );
                }
            });
        })
        .catch((error) => {
            console.error("Error de autenticación:", error);
            alert("Error al iniciar sesión");
        });
});

// Enviar mensaje
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentUser) {
        const encryptedMessage = encryptMessage(message);
        
        database.ref('messages').push({
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: encryptedMessage,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        })
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            console.error("Error al enviar mensaje:", error);
            alert("Error al enviar el mensaje");
        });
    }
}
