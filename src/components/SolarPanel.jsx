import {
  useLayoutEffect,
  useMemo,
  useRef
} from 'react'
import * as THREE from 'three'


/* =========================================================
   REALISTIC FINE DUST / SOILING
   ========================================================= */

function SoilCover({ soilingLevel = 50 }) {

  /*
    Convert the soiling level into visual intensity.

    25%  -> light dust
    50%  -> medium dust
    80%  -> heavy dust
  */

  const intensity = THREE.MathUtils.clamp(
    soilingLevel / 100,
    0.2,
    1
  )


  /* =======================================================
     FINE DUST PARTICLES
     ======================================================= */

  const dustParticles = useMemo(() => {

    const particles = []

    const particleCount =
      Math.floor(60 * intensity)


    for (let i = 0; i < particleCount; i++) {

      /*
        Bias particles toward the lower portion
        of the tilted panel.
      */

      const randomX =
        THREE.MathUtils.randFloat(
          -1.78,
          1.78
        )

      const randomY =
        THREE.MathUtils.randFloat(
          -1.02,
          1.02
        )

      /*
        More particles near lower edge.
      */

      const lowerEdgeBias =
        Math.random() <
        0.35 * intensity

      const y = lowerEdgeBias
        ? THREE.MathUtils.randFloat(
            -1.02,
            -0.45
          )
        : randomY


      /*
        Tiny irregular dust grains
      */

      const size =
        THREE.MathUtils.randFloat(
          0.008,
          0.035
        )


      /*
        Natural earth/dust shades
      */

      const colors = [
        '#6b5237',
        '#786047',
        '#5b4530',
        '#8a7050',
        '#4d3b2a',
        '#927858',
        '#62503a'
      ]


      particles.push({

        id: i,

        position: [
          randomX,
          y,
          0.116 +
            Math.random() * 0.006
        ],

        scale: size,

        color:
          colors[
            Math.floor(
              Math.random() *
              colors.length
            )
          ],

        rotation:
          Math.random() *
          Math.PI

      })
    }


    return particles

  }, [intensity])

  const dustMesh = useRef()

  useLayoutEffect(() => {
    const mesh = dustMesh.current
    const transform = new THREE.Object3D()

    dustParticles.forEach((particle, index) => {
      transform.position.set(...particle.position)
      transform.rotation.set(0, 0, particle.rotation)
      transform.scale.set(
        particle.scale * 1.8,
        particle.scale,
        particle.scale * 0.25
      )
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
      mesh.setColorAt(index, new THREE.Color(particle.color))
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  }, [dustParticles])


  /* =======================================================
     DUST STREAKS
     ======================================================= */

  const streaks = useMemo(() => {

    const result = []

    const streakCount =
      Math.floor(
        10 * intensity
      )

    for (
      let i = 0;
      i < streakCount;
      i++
    ) {

      const x =
        THREE.MathUtils.randFloat(
          -1.65,
          1.65
        )

      const y =
        THREE.MathUtils.randFloat(
          -0.85,
          0.8
        )

      const width =
        THREE.MathUtils.randFloat(
          0.04,
          0.12
        )

      const length =
        THREE.MathUtils.randFloat(
          0.25,
          0.75
        )

      result.push({

        id: i,

        position: [
          x,
          y,
          0.118
        ],

        scale: [
          width,
          length,
          1
        ],

        rotation:
          THREE.MathUtils.randFloat(
            -0.15,
            0.15
          )

      })
    }

    return result

  }, [intensity])


  return (

    <group>


      {/* ===================================================
          VERY LIGHT DUST FILM
          =================================================== */}

      <mesh
        position={[
          0,
          0,
          0.108
        ]}
      >

        <planeGeometry
          args={[
            3.62,
            2.08
          ]}
        />

        <meshStandardMaterial

          color="#8a7358"

          transparent

          opacity={
            0.035 +
            intensity * 0.065
          }

          roughness={1}

          metalness={0}

          depthWrite={false}

        />

      </mesh>


      {/* ===================================================
          FINE DUST GRAINS
          =================================================== */}

      <instancedMesh
        ref={dustMesh}
        args={[null, null, dustParticles.length]}
      >
        <sphereGeometry args={[1, 4, 3]} />
        <meshStandardMaterial
          vertexColors
          roughness={1}
          metalness={0}
        />
      </instancedMesh>


      {/* ===================================================
          SUBTLE DUST STREAKS
          =================================================== */}

      {streaks.map(
        (streak) => (

          <mesh

            key={
              `streak-${streak.id}`
            }

            position={
              streak.position
            }

            rotation={[
              0,
              0,
              streak.rotation
            ]}

            scale={
              streak.scale
            }

          >

            <planeGeometry
              args={[
                1,
                1
              ]}
            />

            <meshStandardMaterial

              color="#6b5238"

              transparent

              opacity={
                0.10 *
                intensity
              }

              roughness={1}

              depthWrite={false}

            />

          </mesh>

        )
      )}


      {/* ===================================================
          LOWER EDGE DUST ACCUMULATION
          =================================================== */}

      <mesh

        position={[
          0,
          -0.99,
          0.122
        ]}

        scale={[
          1,
          0.06 +
            intensity * 0.08,
          1
        ]}

      >

        <planeGeometry
          args={[
            3.45,
            1
          ]}
        />

        <meshStandardMaterial

          color="#5b4630"

          transparent

          opacity={
            0.12 *
            intensity
          }

          roughness={1}

          depthWrite={false}

        />

      </mesh>


      {/* ===================================================
          RANDOM HEAVIER DUST AREAS
          =================================================== */}

      <mesh

        position={[
          -1.05,
          -0.72,
          0.121
        ]}

        rotation={[
          0,
          0,
          -0.12
        ]}

        scale={[
          0.65,
          0.18,
          1
        ]}

      >

        <sphereGeometry
          args={[
            1,
            12,
            5
          ]}
        />

        <meshStandardMaterial

          color="#5a422b"

          transparent

          opacity={
            0.18 *
            intensity
          }

          roughness={1}

        />

      </mesh>


      <mesh

        position={[
          0.75,
          -0.82,
          0.121
        ]}

        rotation={[
          0,
          0,
          0.08
        ]}

        scale={[
          0.55,
          0.15,
          1
        ]}

      >

        <sphereGeometry
          args={[
            1,
            12,
            5
          ]}
        />

        <meshStandardMaterial

          color="#624a31"

          transparent

          opacity={
            0.16 *
            intensity
          }

          roughness={1}

        />

      </mesh>

    </group>
  )
}


/* =========================================================
   SOLAR PANEL
   ========================================================= */

function SolarPanel({
  position = [0, 0, 0],
  covered = false,
  soilingLevel = 0,
  isFaulty = false,
  isSelected = false,
  panelId = null,
  onClick = null
}) {

  const rows = 6
  const columns = 10

  const panelWidth = 4
  const panelHeight = 2.5

  const cellWidth = 0.36
  const cellHeight = 0.34

  const indicatorIntensity = THREE.MathUtils.lerp(
    1.8,
    3.2,
    THREE.MathUtils.clamp(soilingLevel / 100, 0, 1)
  )

  /* =======================================================
     SOLAR CELL POSITIONS
     ======================================================= */

  const cells = useMemo(() => {
    const result = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = -((columns - 1) * cellWidth) / 2 + col * cellWidth
        const y = ((rows - 1) * cellHeight) / 2 - row * cellHeight

        result.push({
          id: `${row}-${col}`,
          position: [x, y, 0.075]
        })
      }
    }
    return result
  }, [])

  return (
    <group
      position={position}
      rotation={[
        THREE.MathUtils.degToRad(-50),
        0,
        0
      ]}
      onClick={(e) => {
        e.stopPropagation()
        if (onClick) onClick(panelId)
      }}
    >
      {/* Visual Fault / Selection Glowing Trim */}
      {isFaulty && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[panelWidth + 0.15, panelHeight + 0.15]} />
          <meshBasicMaterial
            color="#ff2a55"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[panelWidth + 0.2, panelHeight + 0.2]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}


      {/* =================================================
          PANEL BACK
          ================================================= */}

      <mesh
        position={[
          0,
          0,
          0
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            panelWidth,
            panelHeight,
            0.10
          ]}
        />

        <meshStandardMaterial

          color="#101820"

          metalness={0.55}

          roughness={0.3}

        />

      </mesh>


      {/* =================================================
          GLASS
          ================================================= */}

      <mesh
        position={[
          0,
          0,
          0.055
        ]}
      >

        <boxGeometry
          args={[
            3.82,
            2.32,
            0.025
          ]}
        />

        <meshPhysicalMaterial

          color="#061b31"

          metalness={0.35}

          roughness={0.16}

          transmission={0.03}

          clearcoat={0.9}

          clearcoatRoughness={0.1}

        />

      </mesh>


      {/* =================================================
          SOLAR CELLS
          ================================================= */}

      {cells.map(
        (cell) => (

          <mesh
            key={cell.id}
            position={
              cell.position
            }
          >

            <boxGeometry

              args={[
                cellWidth - 0.025,
                cellHeight - 0.025,
                0.018
              ]}

            />

            <meshStandardMaterial

              color="#123c68"

              metalness={0.45}

              roughness={0.18}

            />

          </mesh>

        )
      )}


      {/* =================================================
          VERTICAL CELL LINES
          ================================================= */}

      {Array.from({
        length:
          columns + 1
      }).map(
        (_, index) => {

          const x =
            -(panelWidth / 2) +
            index *
              (panelWidth /
                columns)

          return (

            <mesh

              key={
                `vertical-${index}`
              }

              position={[
                x,
                0,
                0.085
              ]}

            >

              <boxGeometry

                args={[
                  0.010,
                  panelHeight -
                    0.18,
                  0.012
                ]}

              />

              <meshStandardMaterial

                color="#65727c"

                metalness={0.7}

                roughness={0.3}

              />

            </mesh>

          )
        }
      )}


      {/* =================================================
          HORIZONTAL CELL LINES
          ================================================= */}

      {Array.from({
        length:
          rows + 1
      }).map(
        (_, index) => {

          const y =
            -(panelHeight / 2) +
            index *
              (panelHeight /
                rows)

          return (

            <mesh

              key={
                `horizontal-${index}`
              }

              position={[
                0,
                y,
                0.085
              ]}

            >

              <boxGeometry

                args={[
                  panelWidth -
                    0.18,
                  0.010,
                  0.012
                ]}

              />

              <meshStandardMaterial

                color="#65727c"

                metalness={0.7}

                roughness={0.3}

              />

            </mesh>

          )
        }
      )}


      {/* =================================================
          ALUMINUM FRAME
          ================================================= */}

      <mesh
        position={[
          0,
          panelHeight / 2,
          0.09
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            panelWidth + 0.12,
            0.12,
            0.14
          ]}
        />

        <meshStandardMaterial

          color="#9da7b0"

          metalness={0.9}

          roughness={0.22}

        />

      </mesh>


      <mesh
        position={[
          0,
          -panelHeight / 2,
          0.09
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            panelWidth + 0.12,
            0.12,
            0.14
          ]}
        />

        <meshStandardMaterial

          color="#9da7b0"

          metalness={0.9}

          roughness={0.22}

        />

      </mesh>


      <mesh
        position={[
          -panelWidth / 2,
          0,
          0.09
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.12,
            panelHeight,
            0.14
          ]}
        />

        <meshStandardMaterial

          color="#9da7b0"

          metalness={0.9}

          roughness={0.22}

        />

      </mesh>


      <mesh
        position={[
          panelWidth / 2,
          0,
          0.09
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.12,
            panelHeight,
            0.14
          ]}
        />

        <meshStandardMaterial

          color="#9da7b0"

          metalness={0.9}

          roughness={0.22}

        />

      </mesh>


      {/* =================================================
          SOILING STATUS INDICATOR
          ================================================= */}

      {covered && (

        <>

          <pointLight
            color="#ff1f2d"
            intensity={indicatorIntensity}
            distance={1.2}
            decay={2}
            position={[1.72, 0.98, 0.18]}
          />

          <mesh
            position={[1.72, 0.98, 0.19]}
          >

            <sphereGeometry args={[0.055, 8, 8]} />

            <meshStandardMaterial
              color="#ff2635"
              emissive="#ff1020"
              emissiveIntensity={indicatorIntensity}
              roughness={0.25}
              metalness={0.1}
            />

          </mesh>

          <mesh
            position={[1.72, 0.98, 0.185]}
          >

            <torusGeometry args={[0.09, 0.012, 6, 16]} />

            <meshBasicMaterial
              color="#ff1f2d"
              transparent
              opacity={0.72}
            />

          </mesh>

        </>

      )}


      {/* =================================================
          SUPPORT RAILS
          ================================================= */}

      <mesh
        position={[
          0,
          -0.45,
          -0.18
        ]}
      >

        <boxGeometry
          args={[
            3.7,
            0.10,
            0.10
          ]}
        />

        <meshStandardMaterial

          color="#707b84"

          metalness={0.85}

          roughness={0.3}

        />

      </mesh>


      <mesh
        position={[
          0,
          0.45,
          -0.18
        ]}
      >

        <boxGeometry
          args={[
            3.7,
            0.10,
            0.10
          ]}
        />

        <meshStandardMaterial

          color="#707b84"

          metalness={0.85}

          roughness={0.3}

        />

      </mesh>


      {/* =================================================
          SUPPORT LEGS
          ================================================= */}

      <mesh
        position={[
          -1.25,
          0,
          -0.65
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.13,
            0.13,
            1.2
          ]}
        />

        <meshStandardMaterial

          color="#737d85"

          metalness={0.85}

          roughness={0.3}

        />

      </mesh>


      <mesh
        position={[
          1.25,
          0,
          -0.65
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.13,
            0.13,
            1.2
          ]}
        />

        <meshStandardMaterial

          color="#737d85"

          metalness={0.85}

          roughness={0.3}

        />

      </mesh>


      {/* =================================================
          BASES
          ================================================= */}

      <mesh
        position={[
          -1.25,
          0,
          -1.25
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.5,
            0.5,
            0.12
          ]}
        />

        <meshStandardMaterial

          color="#555f67"

          metalness={0.7}

          roughness={0.4}

        />

      </mesh>


      <mesh
        position={[
          1.25,
          0,
          -1.25
        ]}
        castShadow
      >

        <boxGeometry
          args={[
            0.5,
            0.5,
            0.12
          ]}
        />

        <meshStandardMaterial

          color="#555f67"

          metalness={0.7}

          roughness={0.4}

        />

      </mesh>


      {/* =================================================
          SOILING — ALWAYS LAST
          ================================================= */}

      {covered && (

        <SoilCover
          soilingLevel={
            soilingLevel
          }
        />

      )}

    </group>
  )
}


export default SolarPanel