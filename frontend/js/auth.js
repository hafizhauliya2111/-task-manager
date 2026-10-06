const registerForm = document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const registerMessage =
        document.getElementById("registerMessage");

        //input validasi
        if(nama === "") {
            registerMessage.textContent = "Nama wajib diisi.";
            return;
        }

        if (email === "") {
            registerMessage.textContent = "Email wajib diisi.";
            return;
        }

        if (password === "") {
            registerMessage.textContent = "Password wajib diisi.";
            return;
        }

        registerMessage.textContent = "Sedang mendaftar...";

        try {

            const response = await apiRequest (
                "/auth/register.php",
                {
                    method: "POST",

                    body: JSON.stringify({
                        nama,
                        email,
                        password
                    })
                }
            );

            if (response.status === 201) {

                registerMessage.textContent =
                response.data.Mesagge;

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            },1500);


            } else {
                registerMessage.textContent =
                response.data.message;
            }
        } catch (error) {
            console.error(error);

            registerMessage.textContent =
            "Terjadi kesalahan saat menghubungi server.";
        }
    });

}