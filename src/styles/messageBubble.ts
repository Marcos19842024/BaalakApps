import { StyleSheet } from "react-native";

export const stylesmessageBubble = StyleSheet.create({
    container: {
        maxWidth: '90%',
        marginVertical: 4,
    },
    bubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        maxWidth: '100%',
    },
    bubbleOwn: {
        backgroundColor: '#05aaca',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    textOwn: {
        color: '#fffefe',
    },
    textOther: {
        color: '#333',
    },
});