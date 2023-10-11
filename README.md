# react-calendar

> React component for AirJam&#x27;s Calendar component

[![NPM](https://img.shields.io/npm/v/react-calendar.svg)](https://www.npmjs.com/package/react-calendar) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-calendar
```

## Usage

```tsx
import React, { Component } from 'react'

import  { Calendar, ViewType } from '@airjam/reactcalendar';
import '@airjam/reactcalendar/dist/style.css';

class Example extends Component {
  const id = "some_id"; // create a new calendar component from https://airjam.co/calendar and copy its id and paste it here
  render() {
    return <Calendar id="{id}" viewAs={ViewType.List}/>
  }
}
```

## License

MIT © [mjlee1983](https://github.com/mjlee1983)
