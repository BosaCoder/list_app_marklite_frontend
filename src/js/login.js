const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
signupBtn.onclick = (() => {
    loginForm.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
});
loginBtn.onclick = (() => {
    loginForm.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
});
signupLink.onclick = (() => {
    signupBtn.click();
    return false;
});

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch('https://listappmarklite-production.up.railway.app/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: email, clave: password })
    });

    if (response.ok) {
        const data = await response.json();
        alert('Inicio de sesión exitoso');

        // Almacenar el ID del usuario en sessionStorage (o localStorage)
        sessionStorage.setItem('userId', data.idusuario_list_system);

        // Redirigir a home.html
        window.location.href = 'home.html';
    } else {
        alert('Correo o clave incorrectos');
    }
});

document.getElementById("signupForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert('Las claves no coinciden');
        return;
    }

    const response = await fetch('https://listappmarklite-production.up.railway.app/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombres: name, correo: email, clave: password })
    });

    if (response.ok) {
        alert('Registro exitoso');
        window.location.reload();
    } else if (response.status === 409) {  // Manejar conflicto (usuario ya existente)
        const data = await response.json();
        alert(data.message);
    } else {
        alert('Error al registrar');
    }
});