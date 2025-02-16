document.addEventListener('DOMContentLoaded', function () {
    fetchLists();
});

let userId = null;

document.addEventListener('DOMContentLoaded', function () {
    userId = sessionStorage.getItem('userId'); // Obtener el ID del usuario de sessionStorage

    if (userId) {
        fetchLists(); // Cargar las listas del usuario
    } else {
        // Si no hay ID, redirigir al login
        window.location.href = 'index.html';
    }

    //console.log('ID del usuario:', userId);


    window.addEventListener('pageshow', function (event) {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
            //console.log('Recargando la página');
            this.window.location.reload();
        }
    });

    // Si se le da click a circularMenu se llama e.preventDefault(); createNewList(); // Llama a la función para crear una nueva lista
    document.getElementById('add-list').addEventListener('click', function (e) {
        e.preventDefault();
        createNewList();
    });

    document.getElementById('add-list-mobile').addEventListener('click', function (e) {
        e.preventDefault();
        createNewList();
    });
});

userId = sessionStorage.getItem('userId');
//console.log('ID del usuario fuera:', userId);


//Funcion para obtener las listas
function fetchLists() {
    //console.log('en funcion fetchLists');
    if (!userId) {
        console.error('User ID no está disponible');
        return;
    }
    fetch(`https://list-app-marklite-backend.onrender.com/lists/${userId}`)
        .then(response => response.json())
        .then(data => {
            ////console.log(data);
            renderLists(data);
        })
        .catch(error => console.error('Error al cargar las listas:', error));
}

//Funcion para renderizar las listas
function renderLists(lists) {
    //console.log('en funcion renderLists');
    const cardContainer = document.getElementById('card-container');
    cardContainer.innerHTML = ''; // Limpiar las tarjetas actuales

    lists.forEach(list => {
        const card = document.createElement('div');
        card.classList.add('card', 'card-one');
        card.style.backgroundColor = list.color; // Asignar el color de fondo

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        const title = document.createElement('h4');
        title.classList.add('text-middle');
        title.textContent = list.title;
        title.style.color = list.color; // Asignar el color del texto
        //Al dar click en el titulo de la lista se redirige al crud con el id para editarlo
        title.onclick = () => window.location.href = `crud.html?id=${list.id}`;

        cardContent.appendChild(title);
        card.appendChild(cardContent);

        const cardIcons = document.createElement('div');
        cardIcons.classList.add('card-icons');

        // Favorito ícono
        const favLink = document.createElement('a');
        favLink.href = ''; // No redirige a ninguna parte aún
        favLink.title = 'Favorito';
        const favIcon = document.createElement('i');
        favIcon.classList.add('bx', 'bx-label');
        favLink.appendChild(favIcon);

        // Si el campo important de la base de datos es 1, alternar clase de icono a 'bx bxs-label'
        if (list.important == 1) {
            favIcon.classList.toggle('bxs-label');

            // Asignar color del icono desde la base de datos al icono
            favIcon.style.color = list.color;

            // Obtener el color desde la base de datos (hexadecimal)
            const hexColor = list.color;

            // Función para convertir hex a rgba con transparencia
            function hexToRgba(hex, alpha = 0.4) {
                const bigint = parseInt(hex.slice(1), 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }

            // Crear un overlay div con color semitransparente
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = 0;
            overlay.style.left = 0;
            overlay.style.right = 0;
            overlay.style.bottom = 0;
            overlay.style.backgroundColor = hexToRgba(hexColor, 0.2);
            overlay.style.pointerEvents = 'none'; // Asegurar que el overlay no interfiera con eventos de usuario
            //asignar vordes superiores a overlay order-top-left-radius: 8px; border-top-right-radius: 8px;
            overlay.style.borderTopLeftRadius = '8px';
            overlay.style.borderTopRightRadius = '8px';

            // Cambiar el color de .card-content a color de base de datos con transparencia

            cardContent.style.position = 'relative'; // Asegurar que .card-content es relativo para el overlay absoluto
            cardContent.appendChild(overlay);
        }



        //Para cambiar el estado de favorito
        favLink.onclick = (e) => {
            e.preventDefault();
            fetch(`https://list-app-marklite-backend.onrender.com/important/${list.id}`, {
                method: 'PUT'
            })
                .then(response => response.text())
                .then(data => {
                    //console.log(data);
                    fetchLists(); // Recargar las listas
                })
                .catch(error => console.error('Error al marcar como favorito:', error));
        };

        // Editar ícono
        const editLink = document.createElement('a');
        editLink.href = `crud.html?id=${list.id}`; // Asumiendo que edit.html es el HTML 1
        editLink.title = 'Editar';
        const editIcon = document.createElement('i');
        editIcon.classList.add('bx', 'bxs-edit');
        editIcon.style.color = 'black'; // Asignar el color del ícono
        editIcon.onmouseover = () => editIcon.style.color = list.color;
        editIcon.onmouseout = () => editIcon.style.color = 'black';
        editLink.appendChild(editIcon);

        // Eliminar ícono
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.title = 'Eliminar';
        deleteLink.onclick = () => deleteList(list.id);
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('bx', 'bx-trash');
        deleteIcon.style.color = 'black'; // Asignar el color del ícono
        deleteIcon.onmouseover = () => deleteIcon.style.color = list.color;
        deleteIcon.onmouseout = () => deleteIcon.style.color = 'black';
        deleteLink.appendChild(deleteIcon);

        // Agregar ícono
        const addLink = document.createElement('a');
        addLink.href = '#'; // No redirige a ninguna parte aún
        addLink.title = 'Añadir';
        addLink.onclick = (e) => {
            //llamar a la funcion para copiar la lista
        };
        const addIcon = document.createElement('i');
        addIcon.classList.add('bx', 'bx-copy');
        addIcon.style.color = 'black'; // Asignar el color del ícono
        addIcon.onmouseover = () => addIcon.style.color = list.color;
        addIcon.onmouseout = () => addIcon.style.color = 'black';
        addLink.appendChild(addIcon);

        addLink.onclick = (e) => {
            e.preventDefault();
            fetch(`https://list-app-marklite-backend.onrender.com/duplicate/${list.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId }) // Enviar el ID del usuario
            })
                .then(response => response.json())
                .then(data => {
                    //console.log('Lista duplicada con ID:', data.id);
                    fetchLists(); // Recargar las listas para mostrar la lista duplicada
                })
                .catch(error => console.error('Error al duplicar la lista:', error));
        };

        cardIcons.appendChild(favLink);
        cardIcons.appendChild(editLink);
        cardIcons.appendChild(deleteLink);
        cardIcons.appendChild(addLink);

        card.appendChild(cardIcons);
        cardContainer.appendChild(card);
    });
}

//Funcion para crear una nueva lista
function createNewList() {
    //console.log('en funcion createNewList');
    fetch('https://list-app-marklite-backend.onrender.com/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Sin título', userId: userId }) // Enviar el ID del usuario
    })
        .then(response => response.json())
        .then(data => {
            const newId = data.id;
            window.location.href = `crud.html?id=${newId}`; // Redirigir a la nueva lista para su edición
        })
        .catch(error => console.error('Error al crear la nueva lista:', error));
}

//Funcion para eliminar una lista
function deleteList(id) {
    //console.log('en funcion deleteList');
    if (confirm('¿Estás seguro de que deseas eliminar esta lista?')) {
        fetch(`https://list-app-marklite-backend.onrender.com/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userId }) // Enviar el ID del usuario
        })
            .then(response => response.text())
            .then(data => {
                //console.log(data);
                fetchLists(); // Recargar las listas
            })
            .catch(error => console.error('Error al eliminar la lista:', error));
    }
}