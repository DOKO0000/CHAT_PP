
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAODEeLDqgGQs4fiZrp8mNHhu5gx4kaVFM",
  authDomain: "fotocredencial-30d54.firebaseapp.com",
  databaseURL: "https://fotocredencial-30d54-default-rtdb.firebaseio.com",
  projectId: "fotocredencial-30d54",
  storageBucket: "fotocredencial-30d54.firebasestorage.app",
  messagingSenderId: "367956353078",
  appId: "1:367956353078:web:c3a1af92dbd86257d0b897",
  measurementId: "G-RESTQ3S2ZK"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);


const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('loginBtn');
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const secretKey = "clave-secreta-fotocredencial-2023";


const USUARIOS_PERMITIDOS = ['NICKO', 'DOKO', 'DANIEL', 'JULIO'];


let currentUser = null;


function verificarUsuario(username) {
    return USUARIOS_PERMITIDOS.includes(username.toUpperCase());
}


function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
}


function decryptMessage(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}


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


usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim().toUpperCase();
    if (username && !verificarUsuario(username)) {
        usernameInput.classList.add('error');
    } else {
        usernameInput.classList.remove('error');
    }
});


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
    
    signInAnonymously(auth)
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
            const messagesRef = ref(database, 'messages');
            onChildAdded(messagesRef, (snapshot) => {
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
        const messagesRef = ref(database, 'messages');
        
        push(messagesRef, {
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: encryptedMessage,
            timestamp: Date.now()
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
