import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HandLandmark } from '../types';

interface ParticleShapeProps {
  sides: number;
  color: string;
  rotationX: number;
  handsRef: React.MutableRefObject<HandLandmark[][]>;
}

export const ParticleShape: React.FC<ParticleShapeProps> = ({
  sides,
  color,
  rotationX,
  handsRef,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Generate geometry based on "sides"
  // Using SphereGeometry(radius, widthSegments, heightSegments)
  // where "sides" controls the segments to create polygons from particles.
  // We sample points from the vertices of this geometry.
  const { positions, originalPositions } = useMemo(() => {
    // Determine geometry detail based on sides.
    // Low sides = abstract primitive (Tetrahedron-ish), High sides = Sphere.
    // Using Icosahedron for better distribution, but mapping 'sides' to detail.
    // Or straightforward: Sphere with low segments creates the 'polygon' look requested.
    const segmentCount = Math.max(3, sides); // Minimum 3 sides (triangle)
    
    // We create a temporary geometry to extract vertices
    // Using CylinderGeometry to strictly follow "sides per 2d side" logic of a polygon prism
    // Or SphereGeometry for a more rounded 3D polygon feel.
    // Let's go with a Sphere with discrete segments to represent the "Sides".
    const geom = new THREE.SphereGeometry(2.5, segmentCount, segmentCount);
    
    // To make it look like "particle masses", we need more points than just vertices.
    // We can subdivide or just use the vertices if we increase segments heavily.
    // Let's try scattering points on the faces.
    
    const count = geom.attributes.position.count;
    const pos = new Float32Array(count * 3);
    const origPos = new Float32Array(count * 3);

    const positionsArray = geom.attributes.position.array;

    for (let i = 0; i < count; i++) {
        const x = positionsArray[i * 3];
        const y = positionsArray[i * 3 + 1];
        const z = positionsArray[i * 3 + 2];
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        origPos[i * 3] = x;
        origPos[i * 3 + 1] = y;
        origPos[i * 3 + 2] = z;
    }
    
    geom.dispose();
    return { positions: pos, originalPositions: origPos };
  }, [sides]);

  // Update geometry attributes when sides change
  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
    }
  }, [positions, sides]);


  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Apply manual rotation X
    const targetRotationX = THREE.MathUtils.degToRad(rotationX);
    // Smoothly interpolate rotation
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotationX, 0.1);
    
    // Auto rotate Y for effect
    pointsRef.current.rotation.y += delta * 0.1;

    const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const count = currentPositions.length / 3;

    // Convert hand landmarks to world space for interaction
    // MediaPipe gives 0-1 coordinates. 0,0 is top-left.
    const handInteractions: THREE.Vector3[] = [];
    const hands = handsRef.current;

    hands.forEach((hand) => {
      // Use Index finger tip (landmark 8) and Thumb tip (4) and Pinky (20) for interaction points
      [4, 8, 12, 16, 20].forEach((idx) => {
         const lm = hand[idx];
         if (lm) {
             // Map 0..1 to Viewport coordinates
             // x: (0..1) -> (-width/2 .. width/2) (invert x because camera is mirrored)
             // y: (0..1) -> (height/2 .. -height/2)
             const x = (1 - lm.x) * viewport.width - viewport.width / 2;
             const y = -((lm.y) * viewport.height - viewport.height / 2);
             // z: roughly map to 0 for interaction plane, or use z from mediapipe (which is relative to wrist)
             // Let's keep interaction near z=0 plane mostly, but allow some depth if needed.
             // We'll treat hands as spheres of influence at z=2 (camera side) roughly.
             handInteractions.push(new THREE.Vector3(x, y, 0)); // Assume hands operate near center depth
         }
      });
    });

    // Physics Loop
    // "slowly getting pulled back to the original shape over 5 seconds"
    // To achieve a ~5s return time using lerp: target = current + (orig - current) * factor
    // Factor needs to be very small. Frame independent factor: 1 - Math.exp(-delta * rate)
    // Rate of 0.5 means roughly 63% recovery in 2 seconds. Rate 0.2 is slower.
    const returnSpeed = 0.5; // Tuned for "slow" feel
    const repulsionRadius = 1.5;
    const repulsionStrength = 8.0;

    const vector = new THREE.Vector3();
    const originalPosVector = new THREE.Vector3();
    const tempPos = new THREE.Vector3();

    // To handle rotation correctly, we must transform the original static positions 
    // by the object's current world matrix, OR simpler: transform hands into local space.
    // Let's transform hands to local space.
    pointsRef.current.updateWorldMatrix(true, false);
    const worldToLocal = pointsRef.current.matrixWorld.clone().invert();

    const localHandInteractions = handInteractions.map(v => v.clone().applyMatrix4(worldToLocal));

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        
        // Current position (local space)
        tempPos.set(currentPositions[idx], currentPositions[idx+1], currentPositions[idx+2]);
        
        // Original position (local space)
        originalPosVector.set(originalPositions[idx], originalPositions[idx+1], originalPositions[idx+2]);

        // 1. Repulsion from Hands
        let forceX = 0, forceY = 0, forceZ = 0;
        
        for (const handPos of localHandInteractions) {
            const distSq = tempPos.distanceToSquared(handPos);
            if (distSq < repulsionRadius * repulsionRadius) {
                const dist = Math.sqrt(distSq);
                // Calculate push vector
                vector.copy(tempPos).sub(handPos).normalize();
                
                // Strength drops off with distance
                const strength = repulsionStrength * (1 - dist / repulsionRadius);
                
                forceX += vector.x * strength * delta;
                forceY += vector.y * strength * delta;
                forceZ += vector.z * strength * delta;
            }
        }

        // Apply Force
        tempPos.x += forceX;
        tempPos.y += forceY;
        tempPos.z += forceZ;

        // 2. Return to Original Shape (Elasticity)
        // Lerp towards original position
        const lerpFactor = 1 - Math.exp(-returnSpeed * delta);
        tempPos.lerp(originalPosVector, lerpFactor);

        // Update Array
        currentPositions[idx] = tempPos.x;
        currentPositions[idx+1] = tempPos.y;
        currentPositions[idx+2] = tempPos.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};