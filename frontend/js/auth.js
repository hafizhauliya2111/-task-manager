const registerForm = document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const registerMessage =
            document.getElementById("registerMessage");

        registerMessage.textContent = "Sedang mendaftar...";


        try {

            const response = await apiRequest(
                "/auth/register.php",
                {
                    method: "POST",

                    body: JSON.stringify({
                        nama: nama,
                        email: email,
                        password: password
                    })
                }
            );


            if (response.data.success) {

                registerMessage.textContent =
                    response.data.message;

                registerForm.reset();

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