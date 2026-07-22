import { StyleSheet } from "react-native";

export const stylesdosageCalculator = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginTop: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    radioRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    quickButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        margin: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2196f3',
        backgroundColor: 'transparent',
    },
    quickButtonActive: {
        backgroundColor: '#2196f3',
    },
    quickButtonText: {
        fontSize: 12,
        color: '#2196f3',
    },
    quickButtonTextActive: {
        color: 'white',
    },
    input: {
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    calculateButton: {
        backgroundColor: '#4CAF50',
    },
    clearButton: {
        borderColor: '#f44336',
    },
    resultCard: {
        backgroundColor: '#e8f5e9',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    resultTotalContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
    },
    resultTotal: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    resultUnit: {
        fontSize: 20,
        color: '#2e7d32',
        marginLeft: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 12,
    },
    detalleTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    detalleText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    recomendacionContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    recomendacionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#856404',
    },
    recomendacionText: {
        fontSize: 14,
        color: '#856404',
        marginTop: 4,
    },
    footer: {
        marginTop: 8,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});