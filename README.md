# dither

The [Floyd-Steinberg dithering algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering) is a well-known method for reducing an image into a reduced set of colors while attempting to minimize perceptual changes.

Dithering is particulary useful when converting to a bitonal image that only has two colors (like black and white).  For example, consider this original full-color image:

![original color image](image/ex1.original.png)

If we convert it to a bitonal black and white based on a threshold luminosity of 50%, we get a result that loses much of the original detail:

![bitonal image using 50% threshold](image/ex1.bitonal.png)

But using Floyd-Steinberg dithering, we can preserve more information about the brightness of the original image.  It's not nearly as detailed as the original, but it does preserve the general brightness for different regions of the image.
![dithered image](image/ex1.dither.7.3.5.1.png)


# How does it work?

The Floyd-Steinberg algorithm is relatively simple.  It scans the image one pixel at a time, scanning the top line from left to right, then the next line, etc. until it reaches the bottom.  For a bitonal dither, we first need to convert the whole image to grayscale, so that each pixel is has a luminosity (perceived brightness) value of 0 to 255.

As the the algorithm examines each pixel, values 0-127 (<50%) become 0 (black) and values 128-255 (>50%) become 255 (white).  So a dark value of 16 would become black 0.  The "error" is calculated as the difference between the old and new values, which would be 16 in this case.  This error is then distributed across the neighboring pixels that have not yet been scanned, according to the following weights as specified by Floyd and Steinberg:

| x | x | x |
|:-:|:-:|:-:|
| **x** | @ | 7 |
| 3 | 5 | 1 |

As the scan progresses, in a region of dark (but not completely black) pixels, this error will eventually accumulate enough to have an occasional white pixel.  Part of the beauty of the result is the way that these occasional points are spaced out, sometimes appearing to be random and sometimes with a discernable pattern.

![dithering detail](image/detail.png)


# Variations

I was curious why or how the weighting matrix above was calculated.  Floyd-Steinberg is very fast to compute because it only needs to scan once through each pixel.  That is why the error is not distributed to any of the pixels above or to the left in the current row.  But why the 7, 3, 5, 1 values?  I haven't seen any explanation of why these specific values were chosen, besides the fact that they add up to 16 (so actually we are adding 7/16 of the error to the pixel to the right).

| x | x | x |
|:-:|:-:|:-:|
| **x** | @ | 7/16 |
| 3/16 | 5/16 | 1/16 |

I wanted to experiment with other variations of weights.  Maybe other values would result in unpleasant or rigid patterns of dots, and 7,3,5,1 was the only way to have a balanced output?  Well, let's try some variations...

![7.3.5.1](image/ex1.dither.7.3.5.1.png) 7, 3, 5, 1 (Floyd-Steinberg)
![4,4,4,4](image/ex1.dither.4.4.4.4.png) 4, 4, 4, 4 (equal)
![8,0,8,0](image/ex1.dither.8.0.8.0.png) 8, 0, 8, 0 (right and down)
![0,8,0,8](image/ex1.dither.0.8.0.8.png) 0, 8, 0, 8 (diagonals only)
![8.8.0.0](image/ex1.dither.8.8.0.0.png) 8, 8, 0, 0


![0.8.0.-8](image/ex1.dither.0.8.0.-8.png) 0, 8, 0, -8
![-8.0.4.0](image/ex1.dither.-8.0.4.0.png) -8, 0, 4, 0
![-4.4.12.4](image/ex1.dither.-4.4.12.4.png) -4, 4, 12, 4
![-17.0.0.-17](image/ex1.dither.-17.0.0.-17.png) -17, 0, 0, -17


TODO: add animation of a range of values leading to complete degradation


[Try the online demo](https://kgjenkins.github.io/dither/)
