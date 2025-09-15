import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { IncidentTable, type Incident } from '../components/IncidentTable'

describe('IncidentTable Component', () => {
  const mockIncidents: Incident[] = [
    {
      _id: 'incident-1',
      type: 'theft',
      severity: 'critical',
      status: 'open',
      description: 'Tourist bag theft reported',
      createdAt: '2025-09-16T10:30:00.000Z'
    },
    {
      _id: 'incident-2',
      type: 'emergency',
      severity: 'high',
      status: 'acknowledged',
      description: 'Medical emergency',
      createdAt: '2025-09-16T11:15:00.000Z'
    },
    {
      _id: 'incident-3',
      type: 'lost_tourist',
      severity: 'medium',
      status: 'resolved',
      description: 'Tourist lost in market area',
      createdAt: '2025-09-16T12:00:00.000Z'
    }
  ]

  const mockOnAck = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render incident table with correct headers', () => {
    render(<IncidentTable incidents={[]} onAck={mockOnAck} />)
    
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Severity')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should display "No incidents found" when empty', () => {
    render(<IncidentTable incidents={[]} onAck={mockOnAck} />)
    
    expect(screen.getByText('No incidents found')).toBeInTheDocument()
  })

  it('should render incidents with correct data', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    // Check if incident data is displayed
    expect(screen.getByText('theft')).toBeInTheDocument()
    expect(screen.getByText('emergency')).toBeInTheDocument()
    expect(screen.getByText('Tourist bag theft reported')).toBeInTheDocument()
    expect(screen.getByText('Medical emergency')).toBeInTheDocument()
  })

  it('should display correct severity icons', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    // Check for severity icons (emojis)
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('🔴') // critical
    expect(table).toHaveTextContent('🟠') // high  
    expect(table).toHaveTextContent('🟡') // medium
  })

  it('should display correct status badges', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    expect(screen.getByText('OPEN')).toBeInTheDocument()
    expect(screen.getByText('ACKNOWLEDGED')).toBeInTheDocument()
    expect(screen.getByText('RESOLVED')).toBeInTheDocument()
  })

  it('should format timestamps correctly', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    // Should display formatted time (checking for presence of time-like patterns)
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('should show acknowledge button for open incidents', () => {
    const openIncidents = mockIncidents.filter(i => i.status === 'open')
    render(<IncidentTable incidents={openIncidents} onAck={mockOnAck} />)
    
    const ackButtons = screen.getAllByText('Acknowledge')
    expect(ackButtons).toHaveLength(1)
  })

  it('should not show acknowledge button for non-open incidents', () => {
    const nonOpenIncidents = mockIncidents.filter(i => i.status !== 'open')
    render(<IncidentTable incidents={nonOpenIncidents} onAck={mockOnAck} />)
    
    const ackButtons = screen.queryAllByText('Acknowledge')
    expect(ackButtons).toHaveLength(0)
  })

  it('should call onAck when acknowledge button is clicked', async () => {
    const openIncidents = mockIncidents.filter(i => i.status === 'open')
    render(<IncidentTable incidents={openIncidents} onAck={mockOnAck} />)
    
    const ackButton = screen.getByText('Acknowledge')
    fireEvent.click(ackButton)
    
    await waitFor(() => {
      expect(mockOnAck).toHaveBeenCalledWith('incident-1')
    })
  })

  it('should handle incidents with missing description', () => {
    const incidentWithoutDesc: Incident = {
      _id: 'incident-4',
      type: 'other',
      severity: 'low',
      status: 'open',
      createdAt: '2025-09-16T13:00:00.000Z'
    }
    
    render(<IncidentTable incidents={[incidentWithoutDesc]} onAck={mockOnAck} />)
    
    expect(screen.getByText('other')).toBeInTheDocument()
    expect(screen.getByText('🟢')).toBeInTheDocument() // low severity icon
  })

  it('should truncate long incident IDs', () => {
    const longIdIncident: Incident = {
      _id: 'very-long-incident-id-that-should-be-truncated-for-display',
      type: 'test',
      severity: 'low',
      status: 'open',
      createdAt: '2025-09-16T13:00:00.000Z'
    }
    
    render(<IncidentTable incidents={[longIdIncident]} onAck={mockOnAck} />)
    
    // Should show truncated ID
    const truncatedId = screen.getByText(/very-long.*\.\.\./)
    expect(truncatedId).toBeInTheDocument()
  })

  it('should handle unknown severity types', () => {
    const unknownSeverityIncident: Incident = {
      _id: 'incident-5',
      type: 'test',
      severity: 'unknown' as any,
      status: 'open',
      createdAt: '2025-09-16T13:00:00.000Z'
    }
    
    render(<IncidentTable incidents={[unknownSeverityIncident]} onAck={mockOnAck} />)
    
    // Should show default icon for unknown severity
    expect(screen.getByText('⚪')).toBeInTheDocument()
  })

  it('should sort incidents by creation time (newest first)', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    const rows = screen.getAllByRole('row')
    // Skip header row, check data rows
    const dataRows = rows.slice(1)
    
    // First data row should be the newest incident (incident-3)
    expect(dataRows[0]).toHaveTextContent('lost_tourist')
    // Last data row should be the oldest incident (incident-1)
    expect(dataRows[2]).toHaveTextContent('theft')
  })

  it('should be responsive and handle mobile view', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    const table = screen.getByRole('table')
    expect(table).toHaveStyle({ width: '100%' })
  })

  it('should handle click events on table rows', () => {
    render(<IncidentTable incidents={mockIncidents} onAck={mockOnAck} />)
    
    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1] // Skip header
    
    // Should not throw error when clicking on row
    expect(() => fireEvent.click(firstDataRow)).not.toThrow()
  })
})