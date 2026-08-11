// components/visa/GeoShape.tsx
// 几何装饰元素（三角、方块、折线、圆点），带缓慢浮动动画
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GeoShape',
  props: {
    type: { type: String, default: 'triangle' }, // triangle | square | dot | line | circle
    color: { type: String, default: 'white/20' },
    size: { type: String, default: 'w-8 h-8' },
    duration: { type: String, default: '10s' },
    delay: { type: String, default: '0s' },
    className: { type: String, default: '' },
  },
  setup(props) {
    const shapeClass: Record<string, string> = {
      triangle: 'rotate-45',
      square: 'rounded-3px',
      dot: 'rounded-full',
      circle: 'rounded-full border-2',
      line: 'h-1 rounded-full',
    }

    return () => (
      <div
        class={`absolute pointer-events-none animate-float ${props.className}`}
        style={{ animationDuration: props.duration, animationDelay: props.delay }}
        aria-hidden="true"
      >
        <div
          class={`${props.size} ${shapeClass[props.type]}`}
          style={{ backgroundColor: props.type === 'circle' ? 'transparent' : 'currentColor' }}
        />
      </div>
    )
  },
})
