import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  RadioButton,
} from 'react-native-paper';
import { stylesdosageCalculator } from 'src/styles/dosageCalculator';

type DosisType = '1/4' | '1/2' | '3/4' | '1';

export const DosageCalculatorScreen: React.FC = () => {
  const [dosis, setDosis] = useState<DosisType>('1/2');
  const [frecuencia, setFrecuencia] = useState<string>('8'); // horas entre dosis
  const [duracion, setDuracion] = useState<string>('3'); // días
  const [totalTabletas, setTotalTabletas] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<string>('');

  // Valores decimales de cada fracción
  const dosisValues: Record<DosisType, number> = {
    '1/4': 0.25,
    '1/2': 0.5,
    '3/4': 0.75,
    '1': 1,
  };

  // Obtener el texto de la dosis en español
  const getDosisText = (dosis: DosisType): string => {
    const map: Record<DosisType, string> = {
      '1/4': '¼ tableta',
      '1/2': '½ tableta',
      '3/4': '¾ tableta',
      '1': '1 tableta',
    };
    return map[dosis];
  };

  const calcular = (): void => {
    if (!frecuencia || !duracion) {
      setTotalTabletas(null);
      setDetalle('Por favor, completa todos los campos');
      return;
    }

    const frecNum = parseFloat(frecuencia);
    const durNum = parseFloat(duracion);

    if (isNaN(frecNum) || isNaN(durNum) || frecNum <= 0 || durNum <= 0) {
      setTotalTabletas(null);
      setDetalle('Por favor, ingresa valores válidos');
      return;
    }

    // Calcular número de dosis totales
    const horasTotales = durNum * 24;
    const numeroDosis = Math.ceil(horasTotales / frecNum);
    const dosisDecimal = dosisValues[dosis];
    const total = numeroDosis * dosisDecimal;

    // Redondear a 2 decimales
    const totalRedondeado = Math.round(total * 100) / 100;

    setTotalTabletas(totalRedondeado);

    // Generar detalle
    const detalleTexto = 
      `• Dosis: ${getDosisText(dosis)}\n` +
      `• Frecuencia: cada ${frecNum} horas\n` +
      `• Duración: ${durNum} días (${horasTotales} horas)\n` +
      `• Número de dosis: ${numeroDosis}\n` +
      `• Cálculo: ${numeroDosis} × ${dosisDecimal} = ${totalRedondeado} tabletas`;

    setDetalle(detalleTexto);
  };

  const limpiar = (): void => {
    setTotalTabletas(null);
    setDetalle('');
    setFrecuencia('8');
    setDuracion('3');
    setDosis('1/2');
  };

  // Opciones rápidas de frecuencia
  const frecuenciasRapidas = ['4', '6', '8', '12', '24'];

  // Opciones rápidas de duración
  const duracionesRapidas = ['1', '3', '5', '7', '10', '14', '30'];

  return (
    <ScrollView style={stylesdosageCalculator.container}>
      <Card style={stylesdosageCalculator.card}>
        <Card.Content>
          <Title style={stylesdosageCalculator.title}>Calculadora de Dosis</Title>
          <Text style={stylesdosageCalculator.subtitle}>
            Calcula el total de tabletas para surtir una receta
          </Text>
        </Card.Content>
      </Card>

      {/* Dosis */}
      <Card style={stylesdosageCalculator.card}>
        <Card.Content>
          <Text style={stylesdosageCalculator.label}>Dosis por toma</Text>
          <RadioButton.Group
            onValueChange={(value) => setDosis(value as DosisType)}
            value={dosis}
          >
            <View style={stylesdosageCalculator.radioRow}>
              <RadioButton.Item label="¼ tableta" value="1/4" />
              <RadioButton.Item label="½ tableta" value="1/2" />
              <RadioButton.Item label="¾ tableta" value="3/4" />
              <RadioButton.Item label="1 tableta" value="1" />
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Frecuencia */}
      <Card style={stylesdosageCalculator.card}>
        <Card.Content>
          <Text style={stylesdosageCalculator.label}>Frecuencia (horas entre dosis)</Text>
          <View style={stylesdosageCalculator.quickButtonsRow}>
            {frecuenciasRapidas.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  stylesdosageCalculator.quickButton,
                  frecuencia === val && stylesdosageCalculator.quickButtonActive,
                ]}
                onPress={() => setFrecuencia(val)}
              >
                <Text
                  style={[
                    stylesdosageCalculator.quickButtonText,
                    frecuencia === val && stylesdosageCalculator.quickButtonTextActive,
                  ]}
                >
                  cada {val}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            label="Horas entre dosis"
            value={frecuencia}
            onChangeText={setFrecuencia}
            keyboardType="numeric"
            mode="outlined"
            style={stylesdosageCalculator.input}
          />
        </Card.Content>
      </Card>

      {/* Duración */}
      <Card style={stylesdosageCalculator.card}>
        <Card.Content>
          <Text style={stylesdosageCalculator.label}>Duración del tratamiento (días)</Text>
          <View style={stylesdosageCalculator.quickButtonsRow}>
            {duracionesRapidas.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  stylesdosageCalculator.quickButton,
                  duracion === val && stylesdosageCalculator.quickButtonActive,
                ]}
                onPress={() => setDuracion(val)}
              >
                <Text
                  style={[
                    stylesdosageCalculator.quickButtonText,
                    duracion === val && stylesdosageCalculator.quickButtonTextActive,
                  ]}
                >
                  {val} días
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            label="Días"
            value={duracion}
            onChangeText={setDuracion}
            keyboardType="numeric"
            mode="outlined"
            style={stylesdosageCalculator.input}
          />
        </Card.Content>
      </Card>

      {/* Botones de acción */}
      <View style={stylesdosageCalculator.buttonRow}>
        <Button
          mode="contained"
          onPress={calcular}
          style={[stylesdosageCalculator.button, stylesdosageCalculator.calculateButton]}
          icon="calculator"
        >
          Calcular
        </Button>
        <Button
          mode="outlined"
          onPress={limpiar}
          style={[stylesdosageCalculator.button, stylesdosageCalculator.clearButton]}
        >
          Limpiar
        </Button>
      </View>

      {/* Resultado */}
      {totalTabletas !== null && (
        <Card style={[stylesdosageCalculator.card, stylesdosageCalculator.resultCard]}>
          <Card.Content>
            <Text style={stylesdosageCalculator.resultTitle}>Resultado</Text>
            <View style={stylesdosageCalculator.resultTotalContainer}>
              <Text style={stylesdosageCalculator.resultTotal}>
                {totalTabletas}
              </Text>
              <Text style={stylesdosageCalculator.resultUnit}>tabletas</Text>
            </View>
            <View style={stylesdosageCalculator.divider} />
            <Text style={stylesdosageCalculator.detalleTitle}>Desglose:</Text>
            <Text style={stylesdosageCalculator.detalleText}>{detalle}</Text>

            <View style={stylesdosageCalculator.recomendacionContainer}>
              <Text style={stylesdosageCalculator.recomendacionTitle}>💊 Recomendación de surtido:</Text>
              <Text style={stylesdosageCalculator.recomendacionText}>
                {totalTabletas % 1 === 0 
                  ? `Surtir ${totalTabletas} tabletas completas`
                  : `Surtir ${Math.ceil(totalTabletas)} tabletas (${totalTabletas} exactas, redondea al siguiente número entero para evitar faltantes)`}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={stylesdosageCalculator.footer}>
        <Text style={stylesdosageCalculator.footerText}>
          Nota: Los cálculos redondean al alza el número de dosis
        </Text>
      </View>
    </ScrollView>
  );
};