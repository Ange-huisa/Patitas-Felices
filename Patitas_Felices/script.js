const STORAGE_KEY = 'patitas_felices_appointments';
const CORRECT_PIN = '1234';

// Inicialización al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    // Bloqueo de fechas pasadas en el calendario
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Inicializar almacenamiento si no existe
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }

    renderAppointmentsTable();
});

// Alternar menú móvil
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

// Selección directa de servicio desde las tarjetas
function selectService(serviceName) {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceName;
    }
    document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' });
    showToast(`Servicio "${serviceName}" seleccionado.`, 'info');
}

// Obtener citas desde localStorage
function getStoredAppointments() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

// Guardar citas en localStorage
function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    renderAppointmentsTable();
}

// Enviar formulario de reserva
function handleFormSubmit(event) {
    event.preventDefault();

    const ownerName = document.getElementById('ownerName').value.trim();
    const ownerPhone = document.getElementById('ownerPhone').value.trim();
    const ownerEmail = document.getElementById('ownerEmail').value.trim();
    
    const petName = document.getElementById('petName').value.trim();
    const petSpecies = document.getElementById('petSpecies').value;
    const petBreed = document.getElementById('petBreed').value.trim() || 'Sin especificar';
    const petAge = document.getElementById('petAge').value.trim() || 'Sin especificar';
    
    const serviceType = document.getElementById('serviceType').value;
    const vetSelect = document.getElementById('vetSelect').value || 'Cualquier Especialista';
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentNotes = document.getElementById('appointmentNotes').value.trim();

    const currentAppointments = getStoredAppointments();

    // Validar solapamiento de turno con el mismo médico
    const isOverlap = currentAppointments.some(app => 
        app.vetSelect === vetSelect &&
        app.appointmentDate === appointmentDate &&
        app.appointmentTime === appointmentTime &&
        app.status !== 'Cancelada'
    );

    if (isOverlap && vetSelect !== 'Cualquier Especialista') {
        showToast(`El especialista ${vetSelect} ya tiene un turno reservado el ${appointmentDate} a las ${appointmentTime}.`, 'error');
        return;
    }

    const appointmentId = 'PF-' + Math.floor(10000 + Math.random() * 90000);

    const newAppointment = {
        id: appointmentId,
        ownerName,
        ownerPhone,
        ownerEmail,
        petName,
        petSpecies,
        petBreed,
        petAge,
        serviceType,
        vetSelect,
        appointmentDate,
        appointmentTime,
        appointmentNotes,
        status: 'Confirmada',
        createdAt: new Date().toISOString()
    };

    currentAppointments.unshift(newAppointment);
    saveAppointments(currentAppointments);

    document.getElementById('appointmentForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').value = today;

    openTicketModal(newAppointment);
    showToast('¡Cita agendada y guardada exitosamente!', 'success');
}

// Renderizar tabla "Mis Citas"
function renderAppointmentsTable(filterText = '') {
    const tableBody = document.getElementById('appointmentsTableBody');
    const emptyState = document.getElementById('emptyAppointments');
    const badge = document.getElementById('citasBadge');
    const appointments = getStoredAppointments();

    const filtered = appointments.filter(app => {
        const searchStr = (app.petName + ' ' + app.ownerName + ' ' + app.id + ' ' + app.serviceType).toLowerCase();
        return searchStr.includes(filterText.toLowerCase());
    });

    if (badge) {
        const activeCount = appointments.filter(a => a.status !== 'Cancelada').length;
        badge.textContent = activeCount;
        badge.classList.toggle('hidden', activeCount === 0);
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableBody.innerHTML = filtered.map(app => {
        let statusBadge = '';
        if (app.status === 'Confirmada') {
            statusBadge = `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-circle-check mr-1"></i> Confirmada</span>`;
        } else if (app.status === 'Atendida') {
            statusBadge = `<span class="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-check-double mr-1"></i> Atendida</span>`;
        } else {
            statusBadge = `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-circle-xmark mr-1"></i> Cancelada</span>`;
        }

        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="py-4 px-6">
                    <span class="font-mono text-xs font-bold text-teal-300 block">${app.id}</span>
                    <span class="text-xs text-slate-400"><i class="fa-regular fa-calendar mr-1"></i>${app.appointmentDate} - ${app.appointmentTime}</span>
                </td>
                <td class="py-4 px-6">
                    <div class="font-bold text-white">${app.petName}</div>
                    <div class="text-xs text-slate-400">${app.petSpecies} (${app.petBreed})</div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-medium text-slate-200">${app.ownerName}</div>
                    <div class="text-xs text-slate-400"><i class="fa-solid fa-phone text-[10px] mr-1"></i>${app.ownerPhone}</div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-medium text-teal-300">${app.serviceType}</div>
                    <div class="text-xs text-slate-400">${app.vetSelect}</div>
                </td>
                <td class="py-4 px-6 text-center">
                    ${statusBadge}
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick='viewTicketById("${app.id}")' class="text-teal-300 hover:text-white bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 px-3 py-1.5 rounded-lg text-xs transition">
                        <i class="fa-solid fa-receipt mr-1"></i> Ver Ticket
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAppointments() {
    const query = document.getElementById('searchInput').value;
    renderAppointmentsTable(query);
}

// ==========================================
// LÓGICA DE SEGURIDAD ADMIN Y PIN
// ==========================================

function openAdminPinModal() {
    const pinModal = document.getElementById('adminPinModal');
    const pinInput = document.getElementById('adminPinInput');
    const errorMsg = document.getElementById('pinErrorMessage');
    
    errorMsg.classList.add('hidden');
    pinInput.value = '';
    pinModal.classList.remove('hidden');
    setTimeout(() => pinInput.focus(), 100);
}

function closeAdminPinModal() {
    document.getElementById('adminPinModal').classList.add('hidden');
}

function verifyAdminPin(event) {
    event.preventDefault();
    const inputVal = document.getElementById('adminPinInput').value.trim();
    const card = document.getElementById('adminPinCard');
    const errorMsg = document.getElementById('pinErrorMessage');

    if (inputVal === CORRECT_PIN) {
        closeAdminPinModal();
        openAdminPanel();
        showToast("Acceso de Administrador concedido.", "success");
    } else {
        errorMsg.classList.remove('hidden');
        card.classList.add('animate-shake');
        document.getElementById('adminPinInput').value = '';
        setTimeout(() => {
            card.classList.remove('animate-shake');
        }, 400);
    }
}

function openAdminPanel() {
    document.getElementById('adminModal').classList.remove('hidden');
    renderAdminTable();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

function logoutAdmin() {
    closeAdminModal();
    showToast("Sesión de administración cerrada.", "info");
}

function renderAdminTable() {
    const adminBody = document.getElementById('adminTableBody');
    const searchVal = (document.getElementById('adminSearchInput').value || '').toLowerCase();
    const appointments = getStoredAppointments();

    document.getElementById('adminTotalCount').textContent = appointments.length;

    const filtered = appointments.filter(a => {
        const searchStr = (a.id + ' ' + a.petName + ' ' + a.ownerName + ' ' + a.serviceType).toLowerCase();
        return searchStr.includes(searchVal);
    });

    if (filtered.length === 0) {
        adminBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No se encontraron citas en el sistema.</td></tr>`;
        return;
    }

    adminBody.innerHTML = filtered.map(app => `
        <tr class="hover:bg-white/5">
            <td class="p-3.5 font-mono font-bold text-amber-400">${app.id}</td>
            <td class="p-3.5">
                <div class="font-bold text-white">${app.petName}</div>
                <div class="text-[10px] text-slate-400">Dueño: ${app.ownerName} (${app.ownerPhone})</div>
            </td>
            <td class="p-3.5">${app.appointmentDate} <span class="text-slate-400">${app.appointmentTime}</span></td>
            <td class="p-3.5">${app.serviceType}</td>
            <td class="p-3.5 text-center">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    app.status === 'Confirmada' ? 'bg-emerald-500/20 text-emerald-300' :
                    app.status === 'Atendida' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                }">${app.status}</span>
            </td>
            <td class="p-3.5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                    <select onchange="updateAppointmentStatus('${app.id}', this.value)" class="bg-slate-900 border border-white/20 text-white text-[10px] rounded p-1">
                        <option value="Confirmada" ${app.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                        <option value="Atendida" ${app.status === 'Atendida' ? 'selected' : ''}>Atendida</option>
                        <option value="Cancelada" ${app.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                    <button onclick="deleteAppointmentAdmin('${app.id}')" class="text-rose-400 hover:text-rose-200 bg-rose-500/10 p-1.5 rounded-lg transition" title="Eliminar cita">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateAppointmentStatus(id, newStatus) {
    let appointments = getStoredAppointments();
    appointments = appointments.map(app => {
        if (app.id === id) {
            return { ...app, status: newStatus };
        }
        return app;
    });
    saveAppointments(appointments);
    renderAdminTable();
    showToast(`Estado de la cita ${id} cambiado a ${newStatus}.`, "info");
}

function deleteAppointmentAdmin(id) {
    if (confirm(`¿Eliminar la cita ${id} del sistema?`)) {
        let appointments = getStoredAppointments();
        appointments = appointments.filter(app => app.id !== id);
        saveAppointments(appointments);
        renderAdminTable();
        showToast(`Cita ${id} eliminada.`, "info");
    }
}

// ==========================================
// LÓGICA DE COMPROBANTE / TICKET
// ==========================================

function openTicketModal(data) {
    document.getElementById('ticketCode').textContent = data.id;
    document.getElementById('ticketPet').textContent = data.petName;
    document.getElementById('ticketSpecies').textContent = `${data.petSpecies} (${data.petBreed})`;
    document.getElementById('ticketOwner').textContent = data.ownerName;
    document.getElementById('ticketPhone').textContent = data.ownerPhone;
    document.getElementById('ticketService').textContent = data.serviceType;
    document.getElementById('ticketVet').textContent = data.vetSelect;
    document.getElementById('ticketDate').textContent = data.appointmentDate;
    document.getElementById('ticketTime').textContent = data.appointmentTime;

    document.getElementById('ticketModal').classList.remove('hidden');
}

function viewTicketById(id) {
    const appointments = getStoredAppointments();
    const app = appointments.find(a => a.id === id);
    if (app) {
        openTicketModal(app);
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.add('hidden');
}

// Sistema de notificaciones Flotantes (Toast)
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    let bgClass = 'bg-slate-900 border border-white/20 text-white';
    let icon = 'fa-circle-info text-teal-400';

    if (type === 'success') {
        bgClass = 'bg-emerald-950 border border-emerald-500/50 text-white';
        icon = 'fa-circle-check text-emerald-400';
    } else if (type === 'error') {
        bgClass = 'bg-rose-950 border border-rose-500/50 text-white';
        icon = 'fa-triangle-exclamation text-rose-400';
    }

    toast.className = `${bgClass} p-4 rounded-2xl shadow-2xl text-xs flex items-start gap-3 pointer-events-auto toast-enter`;
    toast.innerHTML = `
        <i class="fa-solid ${icon} text-base mt-0.5"></i>
        <div class="flex-1">${message}</div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-enter-active');
    }, 10);

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 4500);
}