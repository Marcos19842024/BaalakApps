import { StyleSheet } from "react-native";

export const stylesmainMenu = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        marginBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        paddingLeft: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 15,
    },
    headerText: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    nameVersion: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
        paddingRight: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    appVersion: {
        fontSize: 14,
        color: '#666',
    },
    menuContainer: {
        flex: 1,
        padding: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF5722',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    menuDescription: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 16,
    },
    footer: {
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    // Ajustar el contenido del botón en el header también
    clinicSelectorButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderColor: '#ff006f',
        paddingHorizontal: 15,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        marginHorizontal: 5,
        minWidth: 200,
    },
    clinicButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clinicName: {
        fontSize: 16,
        color: '#ff006f',
        fontWeight: '600',
        marginLeft: 8,
        marginRight: 5,
        maxWidth: 220,
        flexShrink: 1, // Permite que se reduzca si es necesario
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // También podemos ajustar el modal para más espacio
    clinicModalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 8, // Aumentado el padding
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%', // Limitar altura máxima
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        textAlign: 'center',
    },
    clinicOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 70, // Aumentamos la altura mínima
    },
    clinicOptionSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#ff006f',
    },
    clinicOptionContent: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Cambiado de 'center' a 'flex-start'
        flex: 1,
    },
    clinicTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center', // Para alinear verticalmente
    },
    clinicOptionText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 4, // Espacio entre nombre y contador
    },
    clinicOptionTextSelected: {
        color: '#ff006f',
        fontWeight: '600',
    },
    clinicIconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIconContainer: {
        marginLeft: 8,
    },
    // Para el botón de cerrar
    modalCloseButton: {
        marginTop: 24,
        backgroundColor: '#8f5c03',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});