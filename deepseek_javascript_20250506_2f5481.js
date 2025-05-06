document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const canvas = document.getElementById('canvas');
    const deviceItems = document.querySelectorAll('.device-item');
    const clearBtn = document.getElementById('clear-btn');
    const deviceDescription = document.getElementById('device-description');
    const feedbackMessage = document.getElementById('feedback-message');
    
    // Variables de estado
    let selectedDevice = null;
    let devices = [];
    let connections = [];
    
    // Descripciones de dispositivos
    const descriptions = {
        router: "Un router conecta múltiples redes y dirige el tráfico entre ellas. Funciona en la capa 3 del modelo OSI.",
        switch: "Un switch conecta dispositivos en una red local (LAN). Opera en la capa 2 del modelo OSI y usa direcciones MAC.",
        pc: "Una computadora personal o estación de trabajo que se conecta a la red para enviar y recibir datos.",
        server: "Un servidor proporciona recursos, datos, servicios o programas a otros dispositivos en la red.",
        firewall: "Un firewall protege la red filtrando el tráfico entrante y saliente según reglas de seguridad."
    };
    
    // Reglas de conexión válidas
    const validConnections = {
        router: ['switch', 'pc', 'server', 'firewall', 'router'],
        switch: ['pc', 'server', 'router', 'switch'],
        pc: ['switch', 'router'],
        server: ['switch', 'router', 'firewall'],
        firewall: ['router', 'server']
    };
    
    // Configurar elementos arrastrables del panel
    deviceItems.forEach(item => {
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('click', () => {
            const type = item.getAttribute('data-type');
            deviceDescription.textContent = descriptions[type];
        });
    });
    
    // Configurar el área de trabajo como destino de arrastre
    canvas.addEventListener('dragover', dragOver);
    canvas.addEventListener('drop', drop);
    
    // Botón para limpiar todo
    clearBtn.addEventListener('click', clearWorkspace);
    
    // Teclado para eliminar dispositivos
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && selectedDevice) {
            deleteDevice(selectedDevice);
        }
    });
    
    // Función para arrastrar dispositivos
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-type'));
    }
    
    function dragOver(e) {
        e.preventDefault();
    }
    
    function drop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        placeDevice(type, e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
    }
    
    // Colocar un dispositivo en el área de trabajo
    function placeDevice(type, x, y) {
        const device = document.createElement('div');
        device.className = 'device-placed';
        device.setAttribute('data-type', type);
        device.setAttribute('data-id', Date.now());
        
        device.innerHTML = `
            <img src="img/${type}.png" alt="${type}">
            <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
        `;
        
        device.style.left = `${x - 40}px`;
        device.style.top = `${y - 40}px`;
        
        // Configurar interactividad
        interact(device).draggable({
            onmove: dragMoveListener,
            onend: function() {
                updateConnections();
            }
        });
        
        // Seleccionar dispositivo para conexión
        device.addEventListener('dblclick', () => {
            if (selectedDevice) {
                selectedDevice.classList.remove('selected');
            }
            selectedDevice = device;
            device.classList.add('selected');
            feedbackMessage.textContent = `Seleccionado ${type}. Ahora haz clic en otro dispositivo para conectar.`;
            feedbackMessage.style.backgroundColor = 'transparent';
        });
        
        // Conectar dispositivos
        device.addEventListener('click', (e) => {
            if (selectedDevice && selectedDevice !== device) {
                connectDevices(selectedDevice, device);
                selectedDevice.classList.remove('selected');
                selectedDevice = null;
                e.stopPropagation();
            }
        });
        
        canvas.appendChild(device);
        devices.push(device);
        
        // Mostrar descripción
        deviceDescription.textContent = descriptions[type];
    }
    
    // Mover dispositivos
    function dragMoveListener(e) {
        const target = e.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + e.dy;
        
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }
    
    // Conectar dispositivos
    function connectDevices(device1, device2) {
        const type1 = device1.getAttribute('data-type');
        const type2 = device2.getAttribute('data-type');
        
        // Verificar si la conexión es válida
        const isValid = validConnections[type1].includes(type2) || validConnections[type2].includes(type1);
        
        // Crear conexión visual
        const connection = document.createElement('div');
        connection.className = `connection ${isValid ? 'valid' : 'invalid'}`;
        connection.setAttribute('data-device1', device1.getAttribute('data-id'));
        connection.setAttribute('data-device2', device2.getAttribute('data-id'));
        
        connections.push(connection);
        canvas.appendChild(connection);
        updateConnections();
        
        // Mostrar retroalimentación
        if (isValid) {
            feedbackMessage.textContent = `Conexión válida: ${type1} puede conectarse con ${type2}.`;
            feedbackMessage.style.backgroundColor = '#d4edda';
        } else {
            feedbackMessage.textContent = `Conexión inválida: ${type1} no puede conectarse directamente con ${type2}.`;
            feedbackMessage.style.backgroundColor = '#f8d7da';
        }
    }
    
    // Actualizar las conexiones cuando se mueven dispositivos
    function updateConnections() {
        connections.forEach(conn => {
            const device1Id = conn.getAttribute('data-device1');
            const device2Id = conn.getAttribute('data-device2');
            
            const device1 = document.querySelector(`.device-placed[data-id="${device1Id}"]`);
            const device2 = document.querySelector(`.device-placed[data-id="${device2Id}"]`);
            
            if (device1 && device2) {
                const rect1 = device1.getBoundingClientRect();
                const rect2 = device2.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                
                const x1 = rect1.left + rect1.width/2 - canvasRect.left;
                const y1 = rect1.top + rect1.height/2 - canvasRect.top;
                const x2 = rect2.left + rect2.width/2 - canvasRect.left;
                const y2 = rect2.top + rect2.height/2 - canvasRect.top;
                
                const length = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
                const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
                
                conn.style.width = `${length}px`;
                conn.style.left = `${x1}px`;
                conn.style.top = `${y1}px`;
                conn.style.transform = `rotate(${angle}deg)`;
            }
        });
    }
    
    // Eliminar un dispositivo
    function deleteDevice(device) {
        const deviceId = device.getAttribute('data-id');
        
        // Eliminar conexiones relacionadas
        connections = connections.filter(conn => {
            if (conn.getAttribute('data-device1') === deviceId || conn.getAttribute('data-device2') === deviceId) {
                conn.remove();
                return false;
            }
            return true;
        });
        
        // Eliminar dispositivo
        devices = devices.filter(d => d !== device);
        device.remove();
        selectedDevice = null;
    }
    
    // Limpiar el área de trabajo
    function clearWorkspace() {
        devices.forEach(device => device.remove());
        connections.forEach(conn => conn.remove());
        devices = [];
        connections = [];
        selectedDevice = null;
        feedbackMessage.textContent = 'Área de trabajo limpiada.';
        feedbackMessage.style.backgroundColor = 'transparent';
    }
});