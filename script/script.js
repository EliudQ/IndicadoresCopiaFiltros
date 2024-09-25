// LOGICA PARA NO PERMITIR PASAR A LA SEGUNDA VISTA HASTA QUE NO SE HAYA SUBIDO UN ARCHIVO

document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileName = event.target.files[0]?.name || 'No se ha seleccionado un archivo';
    document.getElementById('fileName').innerText = fileName;
});

document.getElementById('startButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        alert('Archivo seleccionado: ' + fileInput.files[0].name);
        // Aquí se agrega la lógica para procesar el archivo
    } else {
        event.preventDefault();
        alert('Por favor, selecciona un archivo CSV antes de comenzar.');
    }
});
-
///////////// FILTRADO Y DESCARGUE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.getElementById('startButton').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');

    const file = fileInput.files[0];

    // Lista de codigo de tecnicos permitidos
    const allowedCodes = new Set([1166, 1235, 1144, 950, 1187, 1033, 1161, 1351, 1167, 1171, 963, 1038, 1128, 1140, 1159, 952, 1064]);

    // Definir zonas por codigo de tecnicos
    const zoneMapping = {
        'NORTE': new Set([963, 1038]),
        'CENTRO': new Set([1235, 1166, 1033, 1144, 1187, 950]),
        'SUR': new Set([1351, 1161, 1167, 1171]),
        'ADMIN': new Set([1128, 1140, 1159, 952, 1064])
    };

    // Usar PapaParse para leer el archivo CSV y que sea entendida y manipulable para el programa 
    Papa.parse(file, {
        header: true,  // Leer la primera fila como encabezados
        complete: function(results) {
            const data = results.data;

            // Validar que el archivo contiene la columna "Asignado a: - Técnico"
            if (!data[0].hasOwnProperty('Asignado a: - Técnico')) {
                alert('El archivo CSV no contiene la columna "Asignado a: - Técnico".');
                return;
            }

            // Objeto para guardar el primer nombre por Cod_Nom
            const uniqueNames = {};

            // Procesar la columna NOMBRE y crear la nueva columna "Cod_Nom" y "Zona"
            const modifiedData = data.map(row => {
                const asignado = row['Asignado a: - Técnico'];  // Obtener valor de "Nombre"

                if (asignado) {
                    // Usar expresión regular para extraer el código entre paréntesis
                    const match = asignado.match(/\((\d+)\)/);
                    const codNom = match ? parseInt(match[1]) : '';  // Capturar solo los números
                    row['Cod_Nom'] = codNom;

                    // Guardar solo el primer nombre por Cod_Nom
                    if (codNom) {
                        const nameWithoutCode = asignado.replace(/\s*\(\d+\)/, '').trim(); // Quitar el código del nombre
                        if (!uniqueNames[codNom]) {
                            uniqueNames[codNom] = nameWithoutCode;  // Guardar el primer nombre
                        }
                        row['Asignado a: - Técnico'] = uniqueNames[codNom];  // Asignar el primer nombre
                        
                        // Asignar la zona correspondiente
                        for (const [zone, codes] of Object.entries(zoneMapping)) {
                            if (codes.has(codNom)) {
                                row['Zona'] = zone;  // Asignar la zona
                                break;  // Salir del bucle una vez que se encuentre la zona
                            }
                        }
                    }
                }

                return row;
            });

            // Filtrar los datos para conservar solo los que tienen Cod_Nom en la lista permitida
            const filteredData = modifiedData.filter(row => allowedCodes.has(row['Cod_Nom']));

            // Convertir los datos filtrados de vuelta a CSV
            const csv = Papa.unparse(filteredData);

            // Crear un blob y descargar el CSV modificado
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Archivo filtrado.csv';  // Nombre del archivo descargado
            document.body.appendChild(link);  // Agregar el link temporalmente al DOM
            link.click();  // Simular click para iniciar la descarga
            document.body.removeChild(link);  // Remover el link después de la descarga
        }
    });
});
