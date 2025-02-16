// Obtener el ID de la URL
const urlParams = new URLSearchParams(window.location.search);
const currentId = urlParams.get('id') || 1; // Si no hay ID en la URL, usa 1 por defecto

// Arreglo para almacenar los ítems como objetos
let itemsJsonArray = [];
let currentTitle = '';
let colorCard = '';

window.addEventListener('DOMContentLoaded', (event) => {
    const userId = sessionStorage.getItem('userId'); // Obtener el ID del usuario de sessionStorage

    if (userId) {
        //console.log('ID del usuario:', userId);
        // Aquí puedes usar el ID para cargar datos específicos del usuario
    } else {
        // Si no hay ID, redirigir al login
        window.location.href = 'index.html';
    }
});


// Funciones tipo documennt
// Si se hace clic en el botón con ID 'reset-list', todos los ítems se desmarcan
document.getElementById('reset-list').addEventListener('click', function () {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false; // Desmarcar todos los checkboxes
    });
    updateProgress(); // Actualizar la barra de progreso
    itemsJsonArray = itemsJsonArray.map(item => ({ ...item, completed: false })); // Resetear el estado completado
    saveData(); // Guardar cambios en el servidor

    // Renderizar los ítems para reflejar los cambios
    renderItems();
});

// Añadir ítems a la lista al hacer clic en el botón con ID 'add-item'
document.getElementById('add-item').addEventListener('click', function () {
    addItem(false); // Llama a la función para agregar un ítem sin clases
});

// Añadir ítems a la lista al hacer clic en el botón con ID 'add-section'
document.getElementById('add-section').addEventListener('click', function () {
    addItem(true); // Llama a la función para agregar un ítem con clases
});

// Si hay un cambio en un checkbox, se actualiza el progreso y se guardan los datos
document.getElementById('checklist').addEventListener('change', function (e) {
    if (e.target.type === 'checkbox') {
        saveData(); // Guardar datos al cambiar el estado del checkbox
    }
});

// Cargar los datos del servidor al cargar el documento
document.addEventListener('DOMContentLoaded', function () {
    fetchData(); // Cargar datos al iniciar

    const checklist = document.getElementById('checklist');

    // Inicializar Sortable en el checklist
    const sortable = new Sortable(checklist, {
        animation: 150, // Duración de la animación
        handle: '.grip-icon', // Hacer que el ítem sea arrastrable solo desde el ícono de "grip"
        ghostClass: 'none', // Clase que se aplica al elemento mientras se arrastra
        forceFallback: true, // Forzar el uso de la API de arrastrar y soltar
        onStart: function () {
            // Añadir clase al body para cambiar el cursor a mano cerrada y desactivar el hover
            document.body.classList.add('dragging');
        },
        onEnd: function (evt) {
            // Remover clase del body para restaurar el cursor y el hover
            document.body.classList.remove('dragging');

            // Actualizar el orden del arreglo itemsJsonArray después del arrastre
            const newArray = [];
            const checklistItems = document.querySelectorAll('#checklist .li-item');

            checklistItems.forEach(item => {
                const itemText = item.querySelector('span').textContent;
                const isCompleted = item.querySelector('input[type="checkbox"]').checked;
                const isSection = item.classList.contains('section');

                newArray.push({
                    text: itemText,
                    completed: isCompleted,
                    isSection: isSection
                });
            });

            // Actualizar el arreglo global con el nuevo orden
            itemsJsonArray = newArray;
            saveData(); // Guardar los cambios en el servidor
        }
    });
});


// Función para actualizar el orden del arreglo `itemsJsonArray`
function updateOrder() {
    const checklistItems = document.querySelectorAll('#checklist .li-item');
    const newArray = [];

    checklistItems.forEach(item => {
        const itemText = item.querySelector('span').textContent;
        const isCompleted = item.querySelector('input[type="checkbox"]').checked;
        const isSection = item.classList.contains('section');

        newArray.push({
            text: itemText,
            completed: isCompleted,
            isSection: isSection
        });
    });

    // Actualizar el arreglo global con el nuevo orden
    itemsJsonArray = newArray;

    // Guardar los datos en el servidor después de actualizar el orden
    saveData();
}

const colorInput = document.getElementById('color-input');
colorInput.addEventListener('input', function () {
    colorCard = colorInput.value;
    updateColor();
    updateInterfaceColors(); // Actualizar colores en la interfaz
});

// Si se le da click al botón eliminarcon id delete-item se eliminan los items que estén chuleados
document.getElementById('delete-item').addEventListener('click', function () {
    deleteCheckedItems(); // Llama a la función para eliminar ítems chuleados
});

// Función para actualizar la barra de progreso
function updateProgress() {
    //console.log('En funcion updateProgress()'); // Log para depuración
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.section input[type="checkbox"])'); // Excluir checkboxes dentro de secciones
    const totalItems = checkboxes.length;
    let checkedItems = 0;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkedItems++;
        }
    });

    // Calcular el ancho de la barra de progreso
    const progressWidth = (checkedItems / totalItems) * 100;
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${progressWidth}%`; // Uso de comillas invertidas
    document.getElementById('progress-text').textContent = `${Math.round(progressWidth)}%`; // Uso de comillas invertidas

    // Condicional para mostrar 0% si el texto es 'NaN%'
    if (document.getElementById('progress-text').textContent === 'NaN%') {
        document.getElementById('progress-text').textContent = '0%';
    }
}

// Función para agregar un nuevo ítem
function addItem(isSection) {
    //console.log('En funcion addItem()'); // Log para depuración
    const checklist = document.getElementById('checklist');
    const lastItem = checklist.lastElementChild; // Obtener el último ítem en la lista

    // Verificar si se intenta agregar una sección consecutiva
    if (isSection && lastItem && lastItem.classList.contains('section')) {
        alert('No se pueden añadir dos secciones consecutivas.');
        return;
    }

    const newItem = document.createElement('li');

    if (isSection) {
        newItem.classList.add('li-item', 'section'); // Añadir las clases li-item y section
    } else {
        newItem.classList.add('li-item'); // Solo agregar la clase li-item
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ingresa un nuevo ítem...';
    input.classList.add('input-item'); // Asignar clase de estilos al input

    newItem.appendChild(input);
    checklist.appendChild(newItem);
    input.focus();

    let finalized = false; // Bandera para prevenir doble ejecución

    // Escuchar el evento 'blur' para finalizar el ítem al perder el foco
    input.addEventListener('blur', function () {
        if (!finalized && input.value.trim() !== '') {
            finalized = true;
            finalizeItem(input, newItem);
        } else {
            newItem.remove(); // Eliminar el li si el input está vacío
        }
    });

    // Escuchar el evento 'keydown' para detectar "Enter" o "Tab"
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault(); // Prevenir la acción predeterminada del navegador
            if (!finalized && input.value.trim() !== '') {
                finalized = true;
                finalizeItem(input, newItem);
                addItem(false); // Crear un nuevo ítem automáticamente después de guardar
            } else {
                newItem.remove(); // Eliminar el li si el input está vacío
            }
        }
    });
}

// Modificar la función finalizeItem para que llame a checkSections
function finalizeItem(input, newItem) {
    //console.log('En funcion finalizeItem()'); // Log para depuración
    const trimmedInput = input.value.trim();

    // Verificar si el ítem ya existe (considerando mayúsculas y minúsculas)
    const itemExists = itemsJsonArray.some(item => item.text === trimmedInput);
    if (itemExists) {
        alert('No se pueden añadir dos ítems con el mismo texto.');
        newItem.remove(); // Eliminar el ítem duplicado
        return;
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = function () {
        updateProgress(); // Actualizar progreso al cambiar el checkbox
        updateItemStatus(trimmedInput, checkbox.checked); // Actualiza el estado del ítem
        toggleItemStyles(newItem, checkbox.checked); // Aplicar estilos
    };
    const textNode = document.createTextNode(trimmedInput);
    newItem.innerHTML = ''; // Limpiar el li para nuevos elementos
    newItem.appendChild(checkbox);
    newItem.appendChild(textNode);

    // Si es una sección, agregar un atributo de datos
    if (newItem.classList.contains('section')) {
        newItem.setAttribute('data-section', 'true'); // Atributo que indica que es una sección
    }

    // Agregar el ítem como objeto al arreglo JSON
    itemsJsonArray.push({
        text: trimmedInput,
        completed: checkbox.checked,
        isSection: newItem.classList.contains('section') // Guardar si es sección
    });

    // Aplicar estilos si está marcado
    toggleItemStyles(newItem, checkbox.checked);

    // Mostrar el contenido del JSON en consola
    //console.log(itemsJsonArray);
    // Llamar a updateProgress asegura que el progreso se recalcula
    updateProgress();
    // Guardar los datos en el servidor
    saveData();

    checkSections(); // Verificar las secciones después de agregar un ítem
}

// Función para alternar los estilos de los ítems (tachado y cursiva)
function toggleItemStyles(itemElement, isChecked) {
    //console.log('En funcion toggleItemStyles()'); // Log para depuración
    // Seleccionar solo el span que contiene el texto del ítem
    const textSpan = itemElement.querySelector('span');

    if (!itemElement.classList.contains('section')) { // No aplicar a secciones
        if (isChecked) {
            textSpan.style.textDecoration = 'line-through'; // Tachar
            textSpan.style.fontStyle = 'italic'; // Cursiva
        }
    }
}

// Función para actualizar el estado de un ítem
function updateItemStatus(itemText, completed) {
    //console.log('En funcion updateItemStatus()'); // Log para depuración
    itemsJsonArray = itemsJsonArray.map(item => {
        if (item.text === itemText) {
            return { ...item, completed }; // Actualizar el estado del ítem
        }
        return item;
    });
}

// Función para guardar los datos en el servidor
function saveData() {
    //console.log('En funcion saveData()'); // Log para depuración
    const title = document.querySelector('#tittle-card').textContent.trim(); // Obtener el título
    fetch(`https://list-app-marklite-backend.onrender.com/save/${currentId}`, { // Uso de comillas invertidas
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsJsonArray, title }) // Enviar ítems y título en JSON
    })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

    // Renderizar los ítems para reflejar los cambios
    renderItems();
}

// Función para obtener los datos del servidor
function fetchData() {
    //console.log('En funcion fetchData()'); // Log para depuración
    fetch(`https://list-app-marklite-backend.onrender.com/load/${currentId}`) // Uso de comillas invertidas
        .then(response => response.json())
        .then(data => {
            //console.log('Datos recibidos:', data); // Log para depuración
            if (Array.isArray(data)) {
                // Manejo para datos antiguos que no contienen título
                itemsJsonArray = data; // Asignar datos a itemsJsonArray
                currentTitle = ''; // Título vacío por defecto
                colorCard = ''; // Color vacío por defecto
            } else if (data && data.items && data.title !== undefined) {
                itemsJsonArray = data.items; // Asignar ítems
                currentTitle = data.title; // Asignar título
                colorCard = data.color; // Asignar color

                // Establecer el valor del input de color al color recibido
                const colorInput = document.getElementById('color-input');
                colorInput.value = colorCard; // Establecer el valor del input de color

                // Llamar a la función para actualizar colores en la interfaz
                updateInterfaceColors();
            } else {
                console.error('Datos recibidos incompletos o incorrectos:', data);
                return;
            }
            renderItems(); // Renderizar los ítems
            renderTitle(); // Renderizar el título
        })
        .catch(error => console.error('Error al cargar los datos:', error));
}

// Función para verificar si hay una sección sin un ítem normal debajo
function checkSections() {
    //console.log('En funcion checkSections()'); // Log para depuración
    const checklistItems = document.querySelectorAll('#checklist .li-item');
    let lastItemWasSection = false;
    let hasItemsAfterSection = false;

    checklistItems.forEach(item => {
        if (item.classList.contains('section')) {
            if (lastItemWasSection && !hasItemsAfterSection) {
                // Si había una sección antes y no había ítems normales después, ocultar el botón
                document.getElementById('add-section').style.display = 'none';
            }
            lastItemWasSection = true;
            hasItemsAfterSection = false; // Resetear el flag para la nueva sección
        } else {
            hasItemsAfterSection = true;
        }
    });

    // Después de la iteración, si la última sección no tiene ítems normales, ocultar el botón
    if (lastItemWasSection && !hasItemsAfterSection) {
        document.getElementById('add-section').style.display = 'none';
    } else {
        document.getElementById('add-section').style.display = 'inline-block';
    }
}

// Modificar la función renderItems para que llame a checkSections
function renderItems() {
    const checklist = document.getElementById('checklist');
    checklist.innerHTML = ''; // Limpiar la lista actual
    itemsJsonArray.forEach((item, index) => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.completed; // Marcar el checkbox según el estado
        checkbox.onchange = () => {
            updateProgress(); // Actualizar el progreso al cambiar el checkbox
            updateItemStatus(item.text, checkbox.checked); // Actualizar el estado del ítem
            saveData(); // Guardar cambios
            toggleItemStyles(li, checkbox.checked); // Aplicar estilos
        };

        if (item.isSection) {
            li.classList.add('li-item', 'section'); // Añadir las clases li-item y section
        } else {
            li.classList.add('li-item'); // Solo agregar la clase li-item
        }

        // Crear el ícono que aparecerá al hacer hover
        const gripIcon = document.createElement('i');
        gripIcon.classList.add('fa-solid', 'fa-grip', 'grip-icon');

        // Crear el texto del item
        const textSpan = document.createElement('span');
        textSpan.textContent = item.text;
        textSpan.contentEditable = true; // Hacer el span editable
        textSpan.onblur = () => { // Evento para cuando se termina de editar
            updateItemText(textSpan.textContent, index);
        };

        textSpan.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evitar el salto de línea
                textSpan.blur(); // Salir del modo de edición
                addItem(false); // Crear un nuevo ítem después de editar el existente
            }
        });

        // Agregar el ícono y el checkbox al li
        li.appendChild(gripIcon);
        li.appendChild(checkbox);
        li.appendChild(textSpan);
        checklist.appendChild(li);

        toggleItemStyles(li, checkbox.checked);
    });

    updateProgress(); // Actualizar la barra de progreso inicialmente
    checkSections(); // Verificar las secciones después de renderizar
}


function updateColor() {
    //console.log('En funcion updateColor()'); // Log para depuración
    fetch(`https://list-app-marklite-backend.onrender.com/updateColor/${currentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color: colorCard })
    })
        .then(response => response.text())
        .then(data => {
            //console.log(data);
            // Actualizar el color en la interfaz
            updateInterfaceColors(); // Mover la lógica de actualización de color a una función separada
        })
        .catch(error => console.error('Error al actualizar el color:', error));
}

function updateInterfaceColors() {
    //console.log('En funcion updateInterfaceColors()'); // Log para depuración
    document.querySelector('#tittle-card').style.color = colorCard; // Cambiar color del título
    document.querySelector('#delete-item').style.backgroundColor = colorCard; // Cambiar color del botón de eliminar
    document.querySelector('#reset-list').style.backgroundColor = colorCard; // Cambiar color del botón de reiniciar
    document.querySelector('#progress-bar').style.backgroundColor = colorCard; // Cambiar color de la barra de progreso
    document.querySelector('#progress-text').style.color = colorCard; // Cambiar color del texto de progreso
}

// Función para renderizar el título
function renderTitle() {
    const titleElement = document.querySelector('#tittle-card');
    titleElement.textContent = currentTitle || 'Sin título'; // Asignar 'sin título' si está vacío
    titleElement.style.color = colorCard;

    titleElement.addEventListener('focus', function () {
        if (titleElement.textContent.trim() === 'Sin título') {
            titleElement.textContent = ''; // Limpiar si el título es 'sin título'
        }
    });

    titleElement.addEventListener('input', function () {
        if (titleElement.textContent.length > 24) {
            titleElement.textContent = titleElement.textContent.slice(0, 24); // Restringir a 24 caracteres
            alert('El título no puede tener más de 24 caracteres.');
        }
    });

    titleElement.addEventListener('blur', function () {
        if (titleElement.textContent.trim() === '') {
            titleElement.textContent = 'Sin título'; // Asignar 'sin título' si está vacío
        }
        saveData(); // Guardar cambios
    });

    titleElement.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevenir salto de línea
            titleElement.blur(); // Salir del modo de edición
        }
    });

    updateInterfaceColors(); // Asegurarse de que se aplique el color
}


// Función para actualizar el texto de un ítem
function updateItemText(newText, index) {
    //console.log('En funcion updateItemText()'); // Log para depuración
    const trimmedText = newText.trim(); // Recortar espacios
    if (trimmedText === "") {
        // Eliminar el ítem si el texto está vacío
        itemsJsonArray.splice(index, 1); // Eliminar el ítem del arreglo
        renderItems(); // Volver a renderizar la lista para reflejar la eliminación
        saveData(); // Guardar los cambios en el servidor
    } else if (trimmedText !== itemsJsonArray[index].text) {
        // Actualizar el texto si es diferente y no está vacío
        itemsJsonArray[index].text = trimmedText; // Actualizar el texto del ítem
        saveData(); // Guardar los cambios en el servidor
    }
}

// Función para eliminar los ítems chuleados
function deleteCheckedItems() {
    //console.log('En funcion deleteCheckedItems()'); // Log para depuración
    const checklist = document.getElementById('checklist');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');

    // Filtrar el arreglo para eliminar ítems que estén marcados (checked)
    itemsJsonArray = itemsJsonArray.filter((item, index) => {
        const checkbox = checkboxes[index];
        if (checkbox && checkbox.checked) {
            return false; // Excluir el ítem del arreglo si está marcado
        }
        return true; // Incluir el ítem si no está marcado
    });

    // Luego de eliminar los ítems, eliminar las secciones vacías
    const newItemsJsonArray = [];
    let skipSection = false;

    itemsJsonArray.forEach((item, index) => {
        if (item.isSection) {
            // Si es una sección, revisar si los siguientes ítems también son secciones o si no hay ítems.
            if (index === itemsJsonArray.length - 1 || itemsJsonArray[index + 1].isSection) {
                // Si es la última sección o la siguiente es también una sección, no añadirla.
                skipSection = true;
            } else {
                // De lo contrario, añadir la sección y continuar.
                newItemsJsonArray.push(item);
                skipSection = false;
            }
        } else if (!skipSection) {
            // Si no estamos saltando una sección, añadir el ítem.
            newItemsJsonArray.push(item);
        }
    });

    itemsJsonArray = newItemsJsonArray;

    // Guardar los datos en el servidor después de eliminar los ítems
    saveData();

    // Renderizar nuevamente la lista para reflejar los cambios
    renderItems();

    //console.log('Ítems después de eliminar:', itemsJsonArray); // Log para depuración
}
