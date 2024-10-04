// Manejo del archivo CSV
const fileInput = document.getElementById('fileInput'); // Seleccion del archivo CSV 
const startButton = document.getElementById('startButton') // Boton al seleccionar archivo CSV
const fileNameDisplay = document.getElementById('fileName'); //  No selecciona archivo CSV
const tecnicoSelect = document.getElementById('tecnico'); // Seleccion de tecnico
const adminSelect = document.getElementById('admin'); // Selección de administradores

// Conjuntos de códigos permitidos y   asignacion de zonas que no pueden ser duplicados
const allowedCodes = new Set([1166, 1235, 1144, 950, 1187, 1033, 1161, 1351, 1167, 1171, 963, 1038, 1128, 1140, 1159, 952, 1064]);
const zoneMapping = {
    'NORTE': new Set([963, 1038]),
    'CENTRO': new Set([1235, 1166, 1033, 1144, 1187, 950]), 
    'SUR': new Set([1351, 1161, 1167, 1171]),
    'ADMIN': new Set([1128, 1140, 1159, 952, 1064])
};

// Actualizacion del nombre del archivo cuando se selecciona
fileInput.addEventListener('change', function(event) { // Escuchador de evento para change
    const fileName = event.target.files.length > 0 ? event.target.files[0].name : 'No se ha seleccionado un archivo CSV';
    fileNameDisplay.innerText = fileName;
});

// Manejo del botón 'Iniciar'
startButton.addEventListener('click', function() { // Escuchador de evento para click
    if (fileInput.files.length > 0) {
        localStorage.setItem('uploadedFileName', fileInput.files[0].name);
    } else {
        alert('Por favor, selecciona un archivo CSV antes de comenzar.');
    }
});

// Función para convertir días, horas y minutos a horas totales
function convertirATotalHoras(tiempoSolucion) {
    if (!tiempoSolucion) return 0; // Si no hay tiempo de solución, retorna 0

    const regex = /(\d+)\s*días\s*(\d+)\s*horas\s*(\d+)\s*minutos/;
    const match = tiempoSolucion.match(regex);

    if (match) {
        const dias = parseInt(match[1]) || 0;
        const horas = parseInt(match[2]) || 0;
        const minutos = parseInt(match[3]) || 0;
        return dias * 24 + horas + (minutos / 60); // Total en horas 24
    }

    // Si no coincide con el formato, intenta solo con horas
    const regexHoras = /(\d+)\s*horas\s*(\d+)\s*minutos/;
    const matchHoras = tiempoSolucion.match(regexHoras);
    if (matchHoras) {
        const horas = parseInt(matchHoras[1]) || 0;
        const minutos = parseInt(matchHoras[2]) || 0;
        return horas + (minutos / 60); // Total en horas 3
    }

    // O simplemente devolver 0 si no hay coincidencia
    return 0;
}

function processAndDownload(file, selectedCode, type) {
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            const data = results.data;

            // Verificación de columnas necesarias
            if (!data[0].hasOwnProperty('Asignado a: - Técnico') || !data[0].hasOwnProperty('Estadísticas - Tiempo de solución')) {
                alert('El archivo CSV no contiene las columnas necesarias.');
                return;
            }

            const uniqueNames = {};
            const modifiedData = data.map(row => {
                const asignado = row['Asignado a: - Técnico'];
                const tiempoSolucion = row['Estadísticas - Tiempo de solución'];

                if (asignado) {
                    const match = asignado.match(/\((\d+)\)/);
                    const codNom = match ? parseInt(match[1]) : '';
                    row['Cod_Nom'] = codNom;

                    if (codNom) {
                        const nameWithoutCode = asignado.replace(/\s*\(\d+\)/, '').trim();
                        if (!uniqueNames[codNom]) {
                            uniqueNames[codNom] = nameWithoutCode;
                        }
                        row['Asignado a: - Técnico'] = uniqueNames[codNom];

                        // Asignar Zona según el técnico
                        for (const [zone, codes] of Object.entries(zoneMapping)) {
                            if (codes.has(codNom)) {
                                row['Zona'] = zone;
                                break;
                            }
                        }
                    }
                }

                // Convertir tiempo de solución a horas
                const totalHoras = convertirATotalHoras(tiempoSolucion);
                row['TotalHoras'] = totalHoras; // Añadimos totalHoras al row
                console.log(`Tiempo de solución: ${tiempoSolucion}, TotalHoras: ${totalHoras}`); // Imprimir para depuración
                return row;
            });

            // Filtrado de datos según la lógica definida
            const filteredData = modifiedData.filter(row => {
                const { Cod_Nom, TotalHoras } = row;
                if (allowedCodes.has(Cod_Nom)) {
                    if (type === 'tecnico' && Cod_Nom === selectedCode) {
                        if ((row['Zona'] === 'NORTE' || row['Zona'] === 'SUR') && TotalHoras > 24) {
                            return true; // Filtra Norte y Sur > 24 horas
                        } else if (row['Zona'] === 'CENTRO' && TotalHoras > 3) {
                            return true; // Filtra Centro = 3 horas exactas
                        }
                    } else if (type === 'admin' && Cod_Nom === selectedCode) {
                        // Filtrar para administradores según el código seleccionado
                        return true; // Solo los registros que coinciden con el admin seleccionado
                    }
                }
                return false; // No cumple con los filtros
            });

            // Generar y descargar el CSV filtrado
            if (filteredData.length === 0) {
                alert('No se encontraron datos que cumplan con los filtros especificados.');
                return;
            }

            const csv = Papa.unparse(filteredData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Archivo_Filtrado.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
}


// Manejador para la selección de técnico
tecnicoSelect.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const selectedCode = parseInt(this.value);
        processAndDownload(file, selectedCode, 'tecnico'); // Tipo 'tecnico'
    } else {
        alert('Por favor, selecciona un archivo CSV antes de descargar.');
    }
});

// Manejador para la selección de administrador
adminSelect.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const selectedCode = parseInt(this.value);
        processAndDownload(file, selectedCode, 'admin'); // Tipo 'admin'
    } else {
        alert('Por favor, selecciona un archivo CSV antes de descargar.');
    }
});

// Agregar el manejador para el botón de descarga
document.getElementById('downloadAllButton').addEventListener('click', function() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        processAndDownloadAll(file); // Procesar y descargar todos los datos
    } else {
        alert('Por favor, selecciona un archivo CSV antes de descargar.');
    }
});

// Nueva función para procesar y descargar todos los datos de los códigos especificados
function processAndDownloadAll(file) {
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            const data = results.data;

            // Verificación de columnas necesarias
            if (!data[0].hasOwnProperty('Asignado a: - Técnico') || !data[0].hasOwnProperty('Estadísticas - Tiempo de solución')) {
                alert('El archivo CSV no contiene las columnas necesarias.');
                return;
            }

            const uniqueNames = {};
            const modifiedData = data.map(row => {
                const asignado = row['Asignado a: - Técnico'];
                const tiempoSolucion = row['Estadísticas - Tiempo de solución'];

                if (asignado) {
                    const match = asignado.match(/\((\d+)\)/);
                    const codNom = match ? parseInt(match[1]) : '';
                    row['Cod_Nom'] = codNom;

                    if (codNom) {
                        const nameWithoutCode = asignado.replace(/\s*\(\d+\)/, '').trim();
                        if (!uniqueNames[codNom]) {
                            uniqueNames[codNom] = nameWithoutCode;
                        }
                        row['Asignado a: - Técnico'] = uniqueNames[codNom];
                    }
                }

                // Convertir tiempo de solución a horas
                const totalHoras = convertirATotalHoras(tiempoSolucion);
                row['TotalHoras'] = totalHoras; // Añadimos totalHoras al row
                return row;
            });

            // Filtrar datos por los códigos permitidos
            const filteredData = modifiedData.filter(row => {
                return allowedCodes.has(row['Cod_Nom']);
            });

            // Generar y descargar el CSV filtrado
            if (filteredData.length === 0) {
                alert('No se encontraron datos que cumplan con los códigos especificados.');
                return;
            }

            const csv = Papa.unparse(filteredData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Casos_Tics.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
}