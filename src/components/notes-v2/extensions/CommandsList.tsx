import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import {
    Type,
    List,
    ListOrdered,
    Activity,
    Square,
    Heading1,
    Heading2,
    Quote,
    Code,
    ImageIcon,
    CheckSquare,
    LayoutTemplate
} from 'lucide-react'

export const CommandsList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const items = props.items

    const selectItem = (index: number) => {
        const item = items[index]

        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + items.length) - 1) % items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-white border border-gray-100 shadow-2xl rounded-xl p-1 w-64 max-h-80 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 z-[1000]" dir="rtl">
            {items.length ? (
                items.map((item: any, index: number) => (
                    <button
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-right
                            ${index === selectedIndex ? 'bg-emerald-50 text-emerald-600 font-bold' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                            ${index === selectedIndex ? 'bg-emerald-100' : 'bg-gray-100/50'}
                        `}>
                            {item.icon}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="font-medium">{item.title}</span>
                            {item.description && (
                                <span className="text-[10px] text-gray-400 font-normal leading-tight">
                                    {item.description}
                                </span>
                            )}
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-gray-400">لا توجد نتائج</div>
            )}
        </div>
    )
})

CommandsList.displayName = 'CommandsList'
