import React from 'react';
import { View, Text } from 'react-native';
import { stylesmessageBubble } from 'src/styles/messageBubble';

export const MessageBubble = ({ mensaje }) => {
    const alignment = mensaje.esPropio ? 'flex-end' : 'flex-start';
    const bgColor = mensaje.esPropio ? stylesmessageBubble.bubbleOwn : stylesmessageBubble.bubbleOther;
    const textColor = mensaje.esPropio ? stylesmessageBubble.textOwn : stylesmessageBubble.textOther;

    return (
        <View style={[stylesmessageBubble.container, { alignSelf: alignment }]}>
            <View style={[stylesmessageBubble.bubble, bgColor]}>
                <Text style={[stylesmessageBubble.messageText, textColor]}>
                    {mensaje.contenido}
                </Text>
            </View>
        </View>
    );
};