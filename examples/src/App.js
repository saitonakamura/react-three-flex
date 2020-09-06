import * as THREE from 'three'
import React, { Suspense, useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { Canvas, useThree, useFrame, useLoader } from 'react-three-fiber'
import { Flex, Box, useFlexSize } from 'react-three-flex'
import { useAspect, Line, Loader } from 'drei'
import Effects from './components/Effects'
import Text from './components/Text'
import Geo from './components/Geo'
import state from './state'

function HeightReporter({ onReflow }) {
  const size = useFlexSize()
  useLayoutEffect(() => onReflow && onReflow(...size), [onReflow, size])
  return null
}

function Title({ text, tag, images, textScaleFactor, onReflow, left = false }) {
  const textures = useLoader(THREE.TextureLoader, images)
  const { viewport } = useThree()
  return (
    <Box
      flexDirection="column"
      alignItems={left ? 'flex-start' : 'flex-end'}
      justifyContent="flex-start"
      width="100%"
      height="auto"
      minHeight="100%"
    >
      <HeightReporter onReflow={onReflow} />
      <Box
        flexDirection="row"
        width="100%"
        height="auto"
        justifyContent={left ? 'flex-end' : 'flex-start'}
        margin={0}
        flexGrow={1}
        flexWrap="wrap"
      >
        {textures.map((texture, index) => (
          <Box
            key={index}
            centerAnchor
            flexGrow={1}
            marginTop={1}
            marginLeft={left * 1}
            marginRight={!left * 1}
            width="auto"
            height="auto"
            minWidth={3}
            minHeight={3}
            maxWidth={6}
            maxHeight={6}
          >
            {(width, height) => (
              <mesh>
                <planeBufferGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
              </mesh>
            )}
          </Box>
        ))}
      </Box>
      <Box marginLeft={1.5} marginRight={1.5} marginTop={2}>
        <Text
          position={[left ? 1 : -1, 0.5, 1]}
          fontSize={1 * textScaleFactor}
          lineHeight={1}
          letterSpacing={-0.05}
          font="https://cdn.jsdelivr.net/npm/inter-ui/Inter%20(web)/Inter-Regular.woff"
          maxWidth={(viewport.width / 4) * 3}
        >
          {tag}
          <meshBasicMaterial color="#cccccc" toneMapped={false} />
        </Text>
      </Box>
      <Box marginLeft={left ? 1.5 : 1} marginRight={left ? 1 : 1.5} marginBottom={1}>
        <Text
          position-z={0.5}
          textAlign={left ? 'left' : 'right'}
          fontSize={1.5 * textScaleFactor}
          lineHeight={1}
          letterSpacing={-0.05}
          color="black"
          maxWidth={(viewport.width / 4) * 3}
        >
          {text}
        </Text>
      </Box>
    </Box>
  )
}

function DepthLayerCard({ depth, boxWidth, boxHeight, text, textColor, color, map, textScaleFactor }) {
  const ref = useRef()
  const { viewport, size } = useThree()
  const pageLerp = useRef(state.top / size.height)
  useFrame(() => {
    const page = (pageLerp.current = THREE.MathUtils.lerp(pageLerp.current, state.top / size.height, 0.2))
    if (depth >= 0) ref.current.material.opacity = page < state.threshold * 1.7 ? 1 : 1 - (page - state.threshold * 1.7)
  })
  return (
    <>
      <mesh ref={ref} position={[boxWidth / 2, -boxHeight / 2, depth]}>
        <planeBufferGeometry args={[boxWidth, boxHeight]} />
        <meshBasicMaterial color={color} map={map} toneMapped={false} transparent opacity={1} />
      </mesh>
      <Text
        position={[boxWidth / 2, -boxHeight / 2, depth + 1.5]}
        // maxWidth={boxWidth}
        maxWidth={(viewport.width / 4) * 1}
        anchorX="center"
        anchorY="middle"
        textAlign="left"
        fontSize={0.6 * textScaleFactor}
        lineHeight={1}
        letterSpacing={-0.05}
        color={textColor}
      >
        {text}
      </Text>
    </>
  )
}

function Content({ onReflow }) {
  const group = useRef()
  const { viewport, size } = useThree()
  const [boxWidth, boxHeight] = useAspect('cover', 1920, 1920, 0.5)
  const textures = useLoader(
    THREE.TextureLoader,
    state.depthbox.map((props) => props.image)
  )
  const vec = new THREE.Vector3()
  const pageLerp = useRef(state.top / size.height)
  useFrame(() => {
    const page = (pageLerp.current = THREE.MathUtils.lerp(pageLerp.current, state.top / size.height, 0.2))
    const y = page * viewport.height
    const sticky = state.threshold * viewport.height
    group.current.position.lerp(
      vec.set(0, page < state.threshold ? y : sticky, page < state.threshold ? 0 : page * 1.25),
      0.1
    )
  })
  const handleReflow = useCallback((w, h) => onReflow((state.pages = h / viewport.height + 5.5)), [
    onReflow,
    viewport.height,
  ])
  const sizesRef = useRef([])
  const textScaleFactor = Math.min(1, viewport.width / 16)
  return (
    <group ref={group}>
      <Flex
        flexDirection="column"
        position={[-viewport.width / 2, viewport.height / 2, 0]}
        size={[viewport.width, viewport.height, 0]}
        onReflow={handleReflow}
      >
        {state.content.map((props, index) => (
          <Title
            key={index}
            left={!(index % 2)}
            textScaleFactor={textScaleFactor}
            onReflow={(w, h) => {
              sizesRef.current[index] = h
              state.threshold = Math.max(4, (4 / (15.8 * 3)) * sizesRef.current.reduce((acc, e) => acc + e, 0))
            }}
            {...props}
          />
        ))}
        <Box flexDirection="row" width="100%" height="100%" alignItems="center" justifyContent="center">
          <Box centerAnchor>
            <Line
              points={[
                [-20, 0, 0],
                [-9, 0, 0],
              ]}
              color="black"
              lineWidth={0.5}
            />
            <Line
              points={[
                [20, 0, 0],
                [9, 0, 0],
              ]}
              color="black"
              lineWidth={0.5}
            />
            <Text
              position-z={0.5}
              anchorX="center"
              anchorY="middle"
              textAlign="left"
              fontSize={1.5 * textScaleFactor}
              lineHeight={1}
              letterSpacing={-0.05}
              color="black"
              maxWidth={(viewport.width / 4) * 3}
            >
              {state.depthbox[0].text}
            </Text>
          </Box>
        </Box>
        <Box flexDirection="row" width="100%" height="100%" alignItems="center" justifyContent="center">
          <Box>
            <DepthLayerCard
              {...state.depthbox[0]}
              text={state.depthbox[1].text}
              boxWidth={boxWidth}
              boxHeight={boxHeight}
              map={textures[0]}
              textScaleFactor={textScaleFactor}
            />
            <Geo position={[boxWidth / 2, -boxHeight / 2, state.depthbox[1].depth]} />
          </Box>
        </Box>
      </Flex>
    </group>
  )
}

export default function App() {
  const scrollArea = useRef()
  const onScroll = (e) => (state.top = e.target.scrollTop)
  useEffect(() => void onScroll({ target: scrollArea.current }), [])
  const [pages, setPages] = useState(0)

  
  useEffect(() => {
    const setMouse = e => state.mouse= [(e.clientX/window.innerWidth) * 2 - 1, (e.clientY/window.innerHeight) * 2 - 1]
    window.addEventListener('mousemove', setMouse)
    return () => window.removeEventListener('mousemove', setMouse)
  }, [])
  
  return (
    <>
      <Canvas
        concurrent
        colorManagement
        shadowMap
        noEvents
        pixelRatio={2}
        camera={{ position: [0, 0, 10], far: 1000 }}
        gl={{ powerPreference: 'high-performance', alpha: false, antialias: false, stencil: false, depth: false }}
        onCreated={({ gl }) => gl.setClearColor('#f5f5f5')}
      >
        <spotLight
          castShadow
          angle={0.3}
          penumbra={1}
          position={[0, 10, 20]}
          intensity={5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, -10, -10]} color="white" intensity={1} />
        <ambientLight intensity={0.4} />
        <Suspense fallback={null}>
          <Content onReflow={setPages} />
        </Suspense>
        <Effects />
      </Canvas>
      <div className="scrollArea" ref={scrollArea} onScroll={onScroll}>
        <div style={{ height: `${pages * 100}vh` }} />
      </div>
      <Loader />
    </>
  )
}