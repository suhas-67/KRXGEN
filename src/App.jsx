import { useMemo } from 'react'
import {
  Canvas
} from '@react-three/fiber'

import {
  OrbitControls,
  Environment,
  ContactShadows
} from '@react-three/drei'

import SolarPanel from './components/SolarPanel'
import './App.css'


function App() {

  /* =====================================================
     RANDOMLY SELECT EXACTLY 3 SOILED PANELS
     ===================================================== */

  const soiledPanels = useMemo(() => {

    // Create panel indices 0 → 14
    const indices = Array.from(
      { length: 15 },
      (_, index) => index
    )

    // Shuffle them
    for (let i = indices.length - 1; i > 0; i--) {

      const j = Math.floor(
        Math.random() * (i + 1)
      )

      ;[indices[i], indices[j]] =
        [indices[j], indices[i]]
    }

    // Select exactly 3
    const selected = indices.slice(0, 3)

    return new Set(selected)

  }, [])


  /* =====================================================
     RANDOM SOILING INTENSITY
     ===================================================== */

  const soilingLevels = useMemo(() => {

    const levels = {}

    soiledPanels.forEach((index) => {

      levels[index] =
        25 +
        Math.floor(Math.random() * 60)

    })

    return levels

  }, [soiledPanels])


  /* =====================================================
     PANEL POSITIONS
     ===================================================== */

  const panelPositions = Array.from(
    { length: 15 },
    (_, index) => [

      // 3 columns
      (index % 3 - 1) * 4.5,

      // Height
      0.8,

      // 5 rows
      (Math.floor(index / 3) - 2) * 3.3

    ]
  )


  return (

    <div className="app">


      {/* =================================================
          HELIOSENSE HEADER
      ================================================= */}

      <div className="header">

        <h1>
          HELIOSENSE
        </h1>

        <p>
          Solar Performance Monitoring System
        </p>

      </div>


      {/* =================================================
          3D SCENE
      ================================================= */}

      <div className="scene">

        <Canvas

          shadows

          dpr={[1, 1.5]}

          camera={{
            position: [11, 10, 14],
            fov: 48
          }}

        >


          {/* =================================================
              ENVIRONMENT
          ================================================= */}

          <Environment
            preset="sunset"
          />


          {/* =================================================
              SUNLIGHT
          ================================================= */}

          <directionalLight

            castShadow

            position={[
              5,
              8,
              5
            ]}

            intensity={3}

            shadow-mapSize-width={1024}

            shadow-mapSize-height={1024}

          />


          {/* =================================================
              SOFT LIGHT
          ================================================= */}

          <ambientLight
            intensity={0.35}
          />


          {/* =================================================
              15 SOLAR PANELS
          ================================================= */}

          {panelPositions.map(
            (position, index) => {

              const isSoiled =
                soiledPanels.has(index)

              return (

                <SolarPanel

                  key={index}

                  position={position}

                  covered={isSoiled}

                  soilingLevel={
                    soilingLevels[index] || 0
                  }

                />

              )

            }
          )}


          {/* =================================================
              GROUND
          ================================================= */}

          <mesh

            rotation={[
              -Math.PI / 2,
              0,
              0
            ]}

            position={[
              0,
              -1.32,
              0
            ]}

            receiveShadow

          >

            <planeGeometry
              args={[30, 30]}
            />

            <meshStandardMaterial

              color="#111820"

              roughness={0.85}

            />

          </mesh>


          {/* =================================================
              CONTACT SHADOW
          ================================================= */}

          <ContactShadows

            frames={1}

            position={[
              0,
              -1.30,
              0
            ]}

            opacity={0.65}

            scale={20}

            blur={2.5}

            far={12}

          />


          {/* =================================================
              GROUND GRID
          ================================================= */}

          <gridHelper

            args={[
              30,
              30,
              '#26333f',
              '#17212a'
            ]}

            position={[
              0,
              -1.30,
              0
            ]}

          />


          {/* =================================================
              CAMERA CONTROLS
          ================================================= */}

          <OrbitControls

            enableDamping

            dampingFactor={0.08}

            minDistance={8}

            maxDistance={28}

            maxPolarAngle={
              Math.PI / 2.05
            }

          />

        </Canvas>

      </div>

    </div>
  )
}

export default App