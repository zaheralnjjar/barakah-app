import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalculatorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CalculatorDialog: React.FC<CalculatorDialogProps> = ({ open, onOpenChange }) => {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operation, setOperation] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperation: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            let newValue: number;

            switch (operation) {
                case '+':
                    newValue = currentValue + inputValue;
                    break;
                case '-':
                    newValue = currentValue - inputValue;
                    break;
                case '×':
                    newValue = currentValue * inputValue;
                    break;
                case '÷':
                    newValue = currentValue / inputValue;
                    break;
                case '%':
                    newValue = currentValue % inputValue;
                    break;
                default:
                    newValue = inputValue;
            }

            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    };

    const calculate = () => {
        if (operation && previousValue !== null) {
            performOperation('=');
            setOperation(null);
            setPreviousValue(null);
        }
    };

    const buttonClasses = "h-14 text-xl font-semibold rounded-xl transition-all active:scale-95";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[350px] p-4">
                <DialogHeader>
                    <DialogTitle className="text-center">🧮 الآلة الحاسبة</DialogTitle>
                </DialogHeader>

                {/* Display */}
                <div className="bg-muted rounded-xl p-4 mb-4">
                    <div className="text-left text-3xl font-mono font-bold overflow-hidden text-ellipsis" dir="ltr">
                        {display}
                    </div>
                    {operation && previousValue !== null && (
                        <div className="text-left text-sm text-muted-foreground" dir="ltr">
                            {previousValue} {operation}
                        </div>
                    )}
                </div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Row 1 */}
                    <Button variant="outline" className={buttonClasses} onClick={clear}>C</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => performOperation('%')}>%</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => setDisplay(String(-parseFloat(display)))}>±</Button>
                    <Button variant="default" className={cn(buttonClasses, "bg-primary")} onClick={() => performOperation('÷')}>÷</Button>

                    {/* Row 2 */}
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('7')}>7</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('8')}>8</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('9')}>9</Button>
                    <Button variant="default" className={cn(buttonClasses, "bg-primary")} onClick={() => performOperation('×')}>×</Button>

                    {/* Row 3 */}
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('4')}>4</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('5')}>5</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('6')}>6</Button>
                    <Button variant="default" className={cn(buttonClasses, "bg-primary")} onClick={() => performOperation('-')}>-</Button>

                    {/* Row 4 */}
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('1')}>1</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('2')}>2</Button>
                    <Button variant="outline" className={buttonClasses} onClick={() => inputDigit('3')}>3</Button>
                    <Button variant="default" className={cn(buttonClasses, "bg-primary")} onClick={() => performOperation('+')}>+</Button>

                    {/* Row 5 */}
                    <Button variant="outline" className={cn(buttonClasses, "col-span-2")} onClick={() => inputDigit('0')}>0</Button>
                    <Button variant="outline" className={buttonClasses} onClick={inputDecimal}>.</Button>
                    <Button className={cn(buttonClasses, "bg-emerald-600 hover:bg-emerald-700")} onClick={calculate}>=</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Hook to listen for calculator open event
export const useCalculatorListener = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpenCalculator = () => setIsOpen(true);
        window.addEventListener('open-calculator', handleOpenCalculator);
        return () => window.removeEventListener('open-calculator', handleOpenCalculator);
    }, []);

    return { isOpen, setIsOpen };
};

export default CalculatorDialog;
