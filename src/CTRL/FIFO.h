#pragma once

#include "Common.h"
#include <atomic>

template<typename Element, size_t Size>

class FIFOBuffer {
    enum { Capacity = Size + 1 };

    std::atomic<size_t>     _head;
    std::atomic<size_t>     _tail;
    Element                 _array[Capacity];

    size_t increment(size_t index) const {
        return (index + 1) % Capacity;
    }

public:
    FIFOBuffer() : _head(0), _tail(0) {}
    virtual ~FIFOBuffer() {}

    bool push(const Element& item) {
        size_t currentTail = _tail.load();
        size_t nextTail = increment(currentTail);
        if (nextTail != _head.load()) {
            _array[currentTail] = item;
            _tail.store(nextTail);
            return true;
        }
        return false;
    }

    bool pop(Element& item) {
        const size_t currentHead = _head.load();
        if (currentHead == _tail.load()) return false;

        item = _array[currentHead];
        _head.store(increment(currentHead));
        return true;
    }

    Element* pop() {
        const size_t currentHead = _head.load();
        if (currentHead == _tail.load()) return nullptr;

        Element* item = &_array[currentHead];
        _head.store(increment(currentHead));
        return item;
    }

    bool wasEmpty() const {
        return (_head.load() == _tail.load());
    }

    bool wasFull() const {
        const size_t nextTail = increment(_tail.load());
        return (nextTail == _head.load());
    }

    size_t len() const {
        int len = _tail.load() - _head.load();
        if (len < 0) len += Capacity;
        return len;
    }

};