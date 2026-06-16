import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import CardForm from '../components/CardForm'

describe('CardForm', () => {
  // AC-ENTRY-1: title input is focused when form mounts
  it('auto-focuses the title input on mount', () => {
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /card title/i })).toHaveFocus()
  })

  // AC-HAPPY-1: renders title input and Add/Cancel buttons
  it('renders title input, Add button, and Cancel button', () => {
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /card title/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  // AC-HAPPY-1: valid title calls onAdd with trimmed value
  it('calls onAdd with trimmed title and clears input on valid submit', async () => {
    const onAdd = vi.fn()
    render(<CardForm columnId="todo" onAdd={onAdd} onCancel={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /card title/i }), '  My new card  ')
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd).toHaveBeenCalledWith('My new card')
  })

  // AC-HAPPY-1: pressing Enter submits the form
  it('calls onAdd when Enter is pressed in the input', async () => {
    const onAdd = vi.fn()
    render(<CardForm columnId="todo" onAdd={onAdd} onCancel={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /card title/i })
    await userEvent.type(input, 'Enter card{Enter}')
    expect(onAdd).toHaveBeenCalledWith('Enter card')
  })

  // AC-HAPPY-2: Cancel button calls onCancel
  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  // AC-HAPPY-2: Escape key calls onCancel
  it('calls onCancel when Escape is pressed', async () => {
    const onCancel = vi.fn()
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={onCancel} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  // AC-ERROR-1: empty title shows validation message
  it('shows "Title is required" and does not call onAdd when title is empty', () => {
    const onAdd = vi.fn()
    render(<CardForm columnId="todo" onAdd={onAdd} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  // AC-ERROR-1: whitespace-only title shows validation message
  it('shows "Title is required" and does not call onAdd when title is whitespace only', async () => {
    const onAdd = vi.fn()
    render(<CardForm columnId="todo" onAdd={onAdd} onCancel={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /card title/i }), '   ')
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  // AC-ERROR-1: input retains focus after failed validation
  it('input retains focus after validation failure', () => {
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByRole('textbox', { name: /card title/i })).toHaveFocus()
  })

  // AC-ERROR-1: error message associated via aria-describedby
  it('error message is associated with input via aria-describedby', () => {
    render(<CardForm columnId="todo" onAdd={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    const input = screen.getByRole('textbox', { name: /card title/i })
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent(/title is required/i)
  })

  // Validation: title over 100 chars blocked
  it('shows error and does not call onAdd when title exceeds 100 characters', async () => {
    const onAdd = vi.fn()
    render(<CardForm columnId="todo" onAdd={onAdd} onCancel={vi.fn()} />)
    const longTitle = 'a'.repeat(101)
    await userEvent.type(screen.getByRole('textbox', { name: /card title/i }), longTitle)
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
