import React, { useEffect } from 'react';
import c3 from 'c3';
import 'c3/c3.css';

const Chart = ({ data, bindto, type = 'line', xType = 'category', xData = [], axisX = {}, axisY = {} }) => {
  useEffect(() => {
    if (data && xData.length > 0) {
      c3.generate({
        bindto: bindto,
        data: {
          x: 'x',
          columns: [
            ['x', ...xData], // Include x-axis data
            ...data
          ],
          type: type
        },
        axis: {
          x: axisX,
          y: axisY
        }
      });
    }
  }, [data, xData, bindto, type, axisX, axisY]);

  return <div id={bindto.replace('#', '')}></div>;
};

export default Chart;