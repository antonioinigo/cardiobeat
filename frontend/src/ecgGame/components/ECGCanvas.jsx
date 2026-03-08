import React, { useRef, useEffect, useState } from 'react';
import { generateLeadData, RHYTHM_TYPES } from '../utils/ecgGenerator';

const ECGCanvas = ({
  rhythmType,
  heartRate,
  amplitude,
  speed,
  isRunning,
  leadType = 'Derivación-II',
  showGrid = true,
  onHeartBeat = null
}) => {
  const canvasRef = useRef(null);
  const [logicalSize, setLogicalSize] = useState({ width: 800, height: 220 });

  const animationRef = useRef(null);
  const dataPointsRef = useRef([]);
  const spikeMarkersRef = useRef([]);
  const timeRef = useRef(0);

  const lastFrameTsRef = useRef(null);
  const pxRemainderRef = useRef(0);

  const hpYRef = useRef(0);
  const hpXPrevRef = useRef(0);
  const lpYRef = useRef(0);

  const lastPeakTimeRef = useRef(0);
  const previousValueRef = useRef(0);
  const prevPrevValueRef = useRef(0);
  const absEmaRef = useRef(0);
  const peakHoldRef = useRef(0);
  const rGainRef = useRef(1);
  const rGainUntilRef = useRef(0);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;

      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(600, canvas.parentElement.clientWidth);
      const height = 220;

      setLogicalSize({ width, height });

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getFilterPreset = () => {
    switch (rhythmType) {
      case RHYTHM_TYPES.ASYSTOLE:
        return { hpHz: 0.08, lpHz: 20 };
      case RHYTHM_TYPES.VENTRICULAR_FIBRILLATION:
        return { hpHz: 0.20, lpHz: 55 };
      default:
        // Para no “comerse” QRS estrecho
        return { hpHz: 0.12, lpHz: 80 };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = logicalSize.width;
    const height = logicalSize.height;

    const pxPerMm = 6;
    const mmPerSecond = 25;
    const xStepPx = 2;

    const mmPerStep = xStepPx / pxPerMm;
    const secondsPerStep = mmPerStep / mmPerSecond;

    const drawGrid = () => {
      if (!showGrid) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        return;
      }

      const small = pxPerMm;
      const large = pxPerMm * 5;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0,160,0,0.20)';
      ctx.lineWidth = 0.6;
      for (let x = 0; x <= width; x += small) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += small) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(0,120,0,0.35)';
      ctx.lineWidth = 1.2;
      for (let x = 0; x <= width; x += large) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += large) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawWaveform = () => {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      const centerY = height / 2;
      const pxPerMv = pxPerMm * 10;

      for (let i = 0; i < dataPointsRef.current.length; i++) {
        // Mantiene continuidad visual al entrar/salir por el borde izquierdo.
        const x = (i - 1) * xStepPx;
        const y = centerY - dataPointsRef.current[i] * pxPerMv;
        if (i === 0) {
          ctx.moveTo(x, y);
          continue;
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (rhythmType === RHYTHM_TYPES.PACED_VENTRICULAR && spikeMarkersRef.current.length) {
        ctx.save();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.0;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        for (const marker of spikeMarkersRef.current) {
          const x = (marker.index - 1) * xStepPx;
          const yBase = centerY;
          const yPeak = centerY - marker.value * pxPerMv;
          ctx.moveTo(x, yBase);
          ctx.lineTo(x, yPeak);
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    const animate = (ts) => {
      if (!isRunning) {
        lastFrameTsRef.current = ts ?? null;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (lastFrameTsRef.current == null) lastFrameTsRef.current = ts;
      const dtReal = Math.max(0, Math.min(0.05, (ts - lastFrameTsRef.current) / 1000));
      lastFrameTsRef.current = ts;

      drawGrid();

      const sweepPxPerSecond = pxPerMm * mmPerSecond * Math.max(0.05, speed);
      const pxToAdvance = pxRemainderRef.current + sweepPxPerSecond * dtReal;
      const stepsToAdvance = Math.floor(pxToAdvance / xStepPx);
      pxRemainderRef.current = pxToAdvance - stepsToAdvance * xStepPx;

      const stepSignalSeconds = secondsPerStep / Math.max(0.05, speed);
      const { hpHz, lpHz } = getFilterPreset();

      const isSinusRhythm =
        rhythmType === RHYTHM_TYPES.NORMAL ||
        rhythmType === RHYTHM_TYPES.TACHYCARDIA ||
        rhythmType === RHYTHM_TYPES.BRADYCARDIA ||
        rhythmType === RHYTHM_TYPES.SINUS_EXIT_BLOCK ||
        rhythmType === RHYTHM_TYPES.SINUS_ARREST ||
        rhythmType === RHYTHM_TYPES.NSR_WITH_AVB1 ||
        rhythmType === RHYTHM_TYPES.AVB2_TYPE1 ||
        rhythmType === RHYTHM_TYPES.AVB2_TYPE2 ||
        rhythmType === RHYTHM_TYPES.AVB3 ||
        rhythmType === RHYTHM_TYPES.NSR_WITH_PVC ||
        rhythmType === RHYTHM_TYPES.PACED_VENTRICULAR;

      const isAvBlockRhythm =
        rhythmType === RHYTHM_TYPES.NSR_WITH_AVB1 ||
        rhythmType === RHYTHM_TYPES.AVB2_TYPE1 ||
        rhythmType === RHYTHM_TYPES.AVB2_TYPE2 ||
        rhythmType === RHYTHM_TYPES.AVB3;
      const isVentricularPaced = rhythmType === RHYTHM_TYPES.PACED_VENTRICULAR;

      const forcePeakSampling =
        rhythmType === RHYTHM_TYPES.NORMAL ||
        rhythmType === RHYTHM_TYPES.TACHYCARDIA ||
        rhythmType === RHYTHM_TYPES.BRADYCARDIA ||
        rhythmType === RHYTHM_TYPES.SINUS_EXIT_BLOCK ||
        rhythmType === RHYTHM_TYPES.SINUS_ARREST ||
        rhythmType === RHYTHM_TYPES.NSR_WITH_PAC ||
        rhythmType === RHYTHM_TYPES.NSR_WITH_PJC ||
        rhythmType === RHYTHM_TYPES.NSR_WITH_PVC ||
        isAvBlockRhythm ||
        rhythmType === RHYTHM_TYPES.ATRIAL_FIBRILLATION;
      const preserveNegativeMorph = false;

      // Oversampling para evitar aliasing y que los R sean idénticos
      const SUB_SINUS = 20;
      const SUB_PACED = 64;
      const SUB_OTHER = 6;

      const filterSample = (x, dt) => {
        // En sinus: NO filtramos (para no deformar amplitud)
        if (isSinusRhythm) return x;

        const hpTau = 1 / (2 * Math.PI * hpHz);
        const hpA = hpTau / (hpTau + dt);
        const hpY = hpA * (hpYRef.current + x - hpXPrevRef.current);
        hpYRef.current = hpY;
        hpXPrevRef.current = x;

        const lpTau = 1 / (2 * Math.PI * lpHz);
        const lpA = 1 - Math.exp(-dt / lpTau);
        lpYRef.current = lpYRef.current + (hpY - lpYRef.current) * lpA;
        return lpYRef.current;
      };

      const steps = Math.max(1, stepsToAdvance);

      for (let i = 0; i < steps; i++) {
        const subSteps = isVentricularPaced
          ? SUB_PACED
          : (isSinusRhythm ? SUB_SINUS : SUB_OTHER);
        const subDt = stepSignalSeconds / subSteps;

        let bestMaxPositive = -Infinity; // capturar R (positivo) en sinus
        let bestAbsSample = 0; // para preservar complejos negativos (PVC) sin aliasing
        let bestAbs = -Infinity;
        let lastRaw = 0;

        for (let s = 0; s < subSteps; s++) {
          timeRef.current += subDt;

          const raw = generateLeadData(
            timeRef.current,
            rhythmType,
            heartRate,
            amplitude,
            1,
            leadType
          );

          lastRaw = raw;
          if (raw > bestMaxPositive) bestMaxPositive = raw;
          const absRaw = Math.abs(raw);
          if (absRaw > bestAbs) {
            bestAbs = absRaw;
            bestAbsSample = raw;
          }
        }

        let picked;
        let markPacerSpike = false;
        if (isVentricularPaced) {
          // Detecta la espiga por su pico positivo agudo y alto, y dibuja la linea aparte.
          const pacedSpikeThreshold = Math.max(0.35, Math.abs(amplitude) * 0.55);
          const pacedSpikeContrast = Math.max(0.12, Math.abs(amplitude) * 0.18);
          const looksLikePacerSpike =
            bestMaxPositive > pacedSpikeThreshold &&
            (bestMaxPositive - lastRaw) > pacedSpikeContrast;
          markPacerSpike = looksLikePacerSpike;
          picked = lastRaw;
        } else {
          picked = (forcePeakSampling && !preserveNegativeMorph)
            ? bestMaxPositive
            : (preserveNegativeMorph ? bestAbsSample : lastRaw);
        }
        let newValue = filterSample(picked, stepSignalSeconds);

        // detector de latido (audio)
        const beatDetectable = rhythmType !== RHYTHM_TYPES.ASYSTOLE;

        if (beatDetectable) {
          const prev = previousValueRef.current;
          const prev2 = prevPrevValueRef.current;

          const absNow = Math.abs(newValue);
          const absPrev = Math.abs(prev);
          const absPrev2 = Math.abs(prev2);

          const emaAlpha = 1 - Math.exp(-stepSignalSeconds / 0.25);
          absEmaRef.current += (absNow - absEmaRef.current) * emaAlpha;

          const peakDecay = Math.exp(-stepSignalSeconds / 0.8);
          peakHoldRef.current = Math.max(absNow, peakHoldRef.current * peakDecay);

          const dynamicThreshold = absEmaRef.current + (peakHoldRef.current - absEmaRef.current) * 0.55;
          const threshold = Math.max(dynamicThreshold, 0.10);

          const minTimeBetweenBeats =
            rhythmType === RHYTHM_TYPES.VENTRICULAR_FIBRILLATION
              ? 0.08
              : Math.min(0.55, Math.max(0.10, (60 / Math.max(heartRate, 30)) * 0.25));

          const isLocalPeak = absPrev > threshold && absPrev > absPrev2 && absPrev > absNow;

          const qrsFloor = Math.max(0.24, Math.abs(amplitude) * 0.22);
          const isLikelyQRS = absPrev > qrsFloor;

          if (isLocalPeak && isLikelyQRS) {
            const peakTime = timeRef.current - stepSignalSeconds;
            if (peakTime - lastPeakTimeRef.current > minTimeBetweenBeats) {
              lastPeakTimeRef.current = peakTime;
              onHeartBeat?.();
            }

            // Normalizar solo el pico R (ventana corta alrededor del máximo)
            if (
              rhythmType !== RHYTHM_TYPES.VENTRICULAR_FIBRILLATION &&
              rhythmType !== RHYTHM_TYPES.ASYSTOLE &&
              rhythmType !== RHYTHM_TYPES.PACED_VENTRICULAR
            ) {
              const isEctopicSinusRhythm =
                rhythmType === RHYTHM_TYPES.NSR_WITH_PAC ||
                rhythmType === RHYTHM_TYPES.NSR_WITH_PJC ||
                rhythmType === RHYTHM_TYPES.NSR_WITH_PVC;
              const targetPeak = isEctopicSinusRhythm ? 0.86 : 1.1;
              const peak = Math.max(absPrev, 0.2);
              rGainRef.current = targetPeak / peak;
              rGainUntilRef.current = timeRef.current + 0.08;
            }
          }
        }

        // Aplicar ganancia solo durante la ventana del pico R
        if (timeRef.current <= rGainUntilRef.current && newValue > 0) {
          newValue = newValue * rGainRef.current;
        }

        prevPrevValueRef.current = previousValueRef.current;
        previousValueRef.current = newValue;

        dataPointsRef.current.push(newValue);
        if (markPacerSpike) {
          spikeMarkersRef.current.push({
            index: dataPointsRef.current.length - 1,
            value: bestMaxPositive
          });
        }
      }

      const maxPoints = Math.floor(width / xStepPx) + 1;
      if (dataPointsRef.current.length > maxPoints) {
        const removeCount = dataPointsRef.current.length - maxPoints;
        dataPointsRef.current.splice(0, removeCount);
        if (spikeMarkersRef.current.length) {
          spikeMarkersRef.current = spikeMarkersRef.current
            .filter((marker) => marker.index >= removeCount)
            .map((marker) => ({
              ...marker,
              index: marker.index - removeCount
            }));
        }
      }

      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [rhythmType, heartRate, amplitude, speed, isRunning, leadType, showGrid, logicalSize, onHeartBeat]);

  useEffect(() => {
    dataPointsRef.current = [];
    spikeMarkersRef.current = [];
    timeRef.current = 0;
    lastFrameTsRef.current = null;
    pxRemainderRef.current = 0;

    hpYRef.current = 0;
    hpXPrevRef.current = 0;
    lpYRef.current = 0;

    lastPeakTimeRef.current = 0;
    previousValueRef.current = 0;
    prevPrevValueRef.current = 0;
    absEmaRef.current = 0;
    peakHoldRef.current = 0;
    rGainRef.current = 1;
    rGainUntilRef.current = 0;
  }, [rhythmType]);

  return (
    <div className="ecg-canvas-container paper">
      <div className="lead-label">{leadType}</div>
      <canvas
        ref={canvasRef}
        width={logicalSize.width}
        height={logicalSize.height}
        className="ecg-canvas"
      />
    </div>
  );
};

export default ECGCanvas;
