// Función para guardar datos en el almacenamiento local
function guardarDatosEnLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Función para obtener datos del almacenamiento local
function obtenerDatosDeLocalStorage(key) {
    const data = localStorage.getItem(key);
    return JSON.parse(data);
}

// Función para cargar datos desde un archivo JSON
async function cargarDatosDesdeJSON() {
    try {
        const response = await fetch('prestamos.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al cargar los datos desde JSON:', error);
        return [];
    }
}

// Objeto Vue
const app = new Vue({
    el: '#app',
    data: {
        // Datos de entrada
        montoPrestamo: 0,
        tasaInteres: 0,
        plazoPrestamo: 0,
        tipoPrestamo: 'hipotecario',
        moneda: 'usd',
        currencySymbol: '',
        // Resultados
        pagoMensual: 0,
        pagoTotal: 0,
        // Información adicional
        tipoPrestamoInfo: '',
        currencyDetails: '',
        // Tabla de amortización
        tablaAmortizacion: [],
        mostrarTablaAmortizacion: false,
        // Mostrar secciones
        mostrarTiposPrestamo: false,
        mostrarMonedaSeleccion: false
    },
    methods: {
        async calcularPrestamo(event) {
            event.preventDefault();

            // Cargar los datos de los préstamos desde el archivo JSON
            const prestamos = await cargarDatosDesdeJSON();

            // Encuentra el préstamo correspondiente al tipo seleccionado
            const prestamoSeleccionado = prestamos.find(prestamo => prestamo.tipoPrestamo === this.tipoPrestamo);

            if (prestamoSeleccionado) {
                // Calcular el préstamo
                const monthlyInterestRate = this.tasaInteres / 100 / 12;
                const numberOfPayments = this.plazoPrestamo * 12;

                const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
                const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;

                const monthlyPayment = this.montoPrestamo * (numerator / denominator);
                const totalPayment = monthlyPayment * numberOfPayments;

                // Guardar los datos del préstamo en el almacenamiento local
                const datosPrestamo = {
                    loanAmount: this.montoPrestamo,
                    interestRate: this.tasaInteres,
                    loanTerm: this.plazoPrestamo,
                    monthlyPayment: monthlyPayment,
                    totalPayment: totalPayment,
                    selectedCurrency: this.moneda,
                    tipoPrestamo: this.tipoPrestamo
                };
                guardarDatosEnLocalStorage('datosPrestamo', datosPrestamo);

                // Mostrar resultados
                this.pagoMensual = monthlyPayment;
                this.pagoTotal = totalPayment;
                this.mostrarResultado();
            } else {
                alert('Error: No se encontró un préstamo para el tipo seleccionado.');
            }
        },
        mostrarResultado() {
            let currencySymbol = '';
            switch (this.moneda) {
                case 'usd':
                    currencySymbol = '$';
                    break;
                case 'eur':
                    currencySymbol = '€';
                    break;
                case 'ars':
                    currencySymbol = 'ARS$';
                    break;
                default:
                    currencySymbol = '';
                    break;
            }

            this.currencySymbol = currencySymbol;

            this.tipoPrestamoInfo = this.tipoPrestamo === 'personal' ? 'Información adicional para Préstamo Personal.' :
                this.tipoPrestamo === 'hipotecario' ? 'Información adicional para Préstamo Hipotecario.' :
                this.tipoPrestamo === 'automotriz' ? 'Información adicional para Préstamo Automotriz.' :
                'Información adicional para Otro tipo de préstamo.';

            const moneda = this.moneda;
            if (moneda === 'usd') {
                this.currencyDetails = 'La moneda seleccionada es Dólares estadounidenses.';
            } else if (moneda === 'eur') {
                this.currencyDetails = 'La moneda seleccionada es Euros.';
            } else if (moneda === 'ars') {
                this.currencyDetails = 'La moneda seleccionada es Pesos argentinos.';
            }
        },
        calcularAmortizacion() {
            const monthlyInterestRate = this.tasaInteres / 100 / 12;
            const numberOfPayments = this.plazoPrestamo * 12;

            const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
            const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;

            const monthlyPayment = this.montoPrestamo * (numerator / denominator);

            let remainingBalance = this.montoPrestamo;
            let amortizationTable = [];

            for (let i = 1; i <= numberOfPayments; i++) {
                const interestPayment = remainingBalance * monthlyInterestRate;
                const principalPayment = monthlyPayment - interestPayment;
                remainingBalance -= principalPayment;

                const row = {
                    month: i,
                    monthlyPayment: monthlyPayment.toFixed(2),
                    principal: principalPayment.toFixed(2),
                    interest: interestPayment.toFixed(2),
                    remainingBalance: remainingBalance.toFixed(2),
                    paid: false
                };

                amortizationTable.push(row);
            }

            this.tablaAmortizacion = amortizationTable;
            this.mostrarTablaAmortizacion = true;
        },

        marcarComoPagado(index) {
            this.tablaAmortizacion[index].paid = !this.tablaAmortizacion[index].paid;
        },

        resetearFormulario() {
            this.montoPrestamo = 0;
            this.tasaInteres = 0;
            this.plazoPrestamo = 0;
            this.currencySymbol = '';
            this.pagoMensual = 0;
            this.pagoTotal = 0;
            this.tipoPrestamoInfo = '';
            this.currencyDetails = '';
            this.tablaAmortizacion = [];
            this.mostrarTablaAmortizacion = false;
        },
        mostrarInicio() {
            this.mostrarTiposPrestamo = false;
            this.mostrarMonedaSeleccion = false;
            this.mostrarTablaAmortizacion = false;
        },
        mostrarTiposPrestamos() {
            this.mostrarTiposPrestamo = true;
            this.mostrarMonedaSeleccion = false;
            this.mostrarTablaAmortizacion = false;
        },
        mostrarMoneda() {
            this.mostrarTiposPrestamo = false;
            this.mostrarMonedaSeleccion = true;
            this.mostrarTablaAmortizacion = false;
        }
    },
    mounted() {
        // Obtener los datos del préstamo del almacenamiento local al cargar la página
        const datosPrestamo = obtenerDatosDeLocalStorage('datosPrestamo');
        if (datosPrestamo) {
            this.montoPrestamo = datosPrestamo.loanAmount;
            this.tasaInteres = datosPrestamo.interestRate;
            this.plazoPrestamo = datosPrestamo.loanTerm;
            this.moneda = datosPrestamo.selectedCurrency;
            this.tipoPrestamo = datosPrestamo.tipoPrestamo;
            this.mostrarResultado();
        }
    }
});
