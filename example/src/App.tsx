import * as React from 'react'
import { useErrorBoundary } from 'use-error-boundary'
import { Redirect, Route, Router, useRoute } from 'wouter'

import { DemoPanel, Dot, Error, Loading, Page } from './components'
import './styles.css'

import * as demos from './demos'

const DEFAULT_COMPONENT_NAME = 'BetterFluid'
// on GitHub Pages the demos live under /better-r3f/
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const visibleComponents: any = Object.entries(demos).reduce((acc, [name, item]) => ({ ...acc, [name]: item }), {})

function ErrorBoundary({ children, fallback, name }: any) {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()
  return didCatch ? fallback(error) : <ErrorBoundary key={name}>{children}</ErrorBoundary>
}

// the particle demos are one scene: moving between them keeps it, so the particles can travel to the next formation
const PARTICLES = new Set(['BetterFluid', 'BetterInstancing', 'BetterRerenders', 'BetterPool'])

function Demo() {
  const [match, params] = useRoute('/demo/:name')
  const compName = match ? params.name : DEFAULT_COMPONENT_NAME
  const { Component } = visibleComponents[compName]

  return (
    <ErrorBoundary
      key={PARTICLES.has(compName) ? 'particles' : compName}
      fallback={(e: any) => <Error>{e.message}</Error>}>
      <Component name={compName} />
    </ErrorBoundary>
  )
}

function Dots() {
  const [match, params] = useRoute('/demo/:name')
  // the better-r3f demos list each other in their own panel
  if (!match || params.name.startsWith('Better')) return null

  return (
    <>
      <DemoPanel>
        {Object.entries(visibleComponents).map(function mapper([name, item]) {
          const background = params.name === name ? 'salmon' : '#fff'
          return <Dot key={name} to={`/demo/${name}`} style={{ background }} />
        })}
      </DemoPanel>
      <span style={{ color: 'white' }}>{params.name}</span>
    </>
  )
}

export default function App() {
  const dev = new URLSearchParams(location.search).get('dev')

  return (
    <Router base={BASE}>
      <Page>
        <React.Suspense fallback={<Loading />}>
          <Route path="/" children={<Redirect to={`/demo/${DEFAULT_COMPONENT_NAME}`} />} />
          <Route path="/demo/:name">
            <Demo />
          </Route>
        </React.Suspense>
        {dev === null && <Dots />}
      </Page>
    </Router>
  )
}
