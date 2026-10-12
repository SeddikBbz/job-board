import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SkillPicker } from '@/components/skill-picker'

afterEach(cleanup)

const categories = [
  { id: 1, name: 'Frontend' },
  { id: 2, name: 'Backend' },
]
const skills = [
  { id: 10, name: 'React', categories: [1], aliases: ['reactjs'], popular: true },
  { id: 11, name: 'Vue.js', categories: [1], aliases: ['vue'], popular: false },
  { id: 12, name: 'Node.js', categories: [2], aliases: ['node'], popular: true },
  { id: 13, name: 'Go', categories: [2], aliases: ['golang'], popular: false },
]
const hidden = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="skills"]')].map((i) => i.value)

describe('SkillPicker', () => {
  it('searches names and aliases, ignoring case', () => {
    render(<SkillPicker name="skills" label="Skills" skills={skills} categories={categories} />)
    fireEvent.change(screen.getByLabelText('Search skills'), { target: { value: 'GOLANG' } })
    expect(screen.getByLabelText('Go')).toBeTruthy()
    expect(screen.queryByLabelText('React')).toBeNull()
  })

  it('selects and removes skills, and submits their ids', () => {
    const { container } = render(<SkillPicker name="skills" label="Skills" skills={skills} categories={categories} />)
    fireEvent.click(screen.getAllByLabelText('React')[0])
    fireEvent.click(screen.getAllByLabelText('Node.js')[0])
    expect(hidden(container)).toEqual(['10', '12'])

    fireEvent.click(screen.getByRole('button', { name: 'Remove React' }))
    expect(hidden(container)).toEqual(['12'])
  })

  it('stops at the maximum and says so', () => {
    const { container } = render(
      <SkillPicker name="skills" label="Skills" skills={skills} categories={categories} defaultValue={[10, 12]} max={2} />,
    )
    expect(screen.getByText(/maximum reached/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Search skills'), { target: { value: 'go' } })
    const go = screen.getByLabelText('Go') as HTMLInputElement
    expect(go.disabled).toBe(true)
    fireEvent.click(go)
    expect(hidden(container)).toEqual(['10', '12'])
  })
})
